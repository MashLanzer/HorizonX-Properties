@echo off
:: =================================================================
:: SCRIPT DE DESPLIEGUE ULTRA-RAPIDO v3.6
:: Autor: Manus AI
:: Proyecto: HorizonX Properties
:: =================================================================

:: --- CONFIGURACION ---
:: ¡IMPORTANTE! Asegúrate de que esta ruta sea la correcta para tu proyecto en tu PC.
set "PROJECT_PATH=D:\Projects\HorizonX Properties\HorizonX Properties"
set "GIT_BRANCH=main"
set "FIREBASE_PROJECT=horizonx-properties"

:: --- INICIO DEL PROCESO ---
TITLE Asistente de Despliegue Ultra-Rapido - %FIREBASE_PROJECT%
color 0F
cls

echo.
echo  =================================================================
echo    ASISTENTE DE DESPLIEGUE ULTRA-RAPIDO - %FIREBASE_PROJECT%
echo  =================================================================
echo.

:: --- PASO 1: COMPROBANDO CAMBIOS ---
echo  [PASO 1] Comprobando cambios en el proyecto...
cd /d "%PROJECT_PATH%"
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] No se pudo encontrar la ruta del proyecto: "%PROJECT_PATH%".
    echo  [ACCION] Por favor, edita este script y corrige la variable 'PROJECT_PATH'.
    color 0C
    goto :END
)

:: Se comprueba si hay cambios. El 'git add' se moverá más adelante.
git diff-index --quiet --ignore-cr-at-eol HEAD
if %errorlevel%==1 (
    goto :CHANGES_FOUND
) else (
    echo  [INFO] No se encontraron cambios en los archivos. No se requiere accion.
    goto :END
)

:: --- PASO 2: VISTA PREVIA Y COMMIT ---
:CHANGES_FOUND
echo  [INFO] Se han detectado cambios.
echo.
echo  ------------------- VISTA PREVIA DE CAMBIOS -------------------
git status
echo  ---------------------------------------------------------------
echo.

set /p COMMIT_MSG= [ACCION REQUERIDA] Describe los cambios para el commit: 
if not defined COMMIT_MSG (
    echo.
    echo  [ERROR] El mensaje del commit no puede estar vacio. Proceso cancelado.
    color 0C
    goto :END
)

echo.
echo  [PASO 2] Guardando cambios con el mensaje: "%COMMIT_MSG%"
:: 'git add .' se ejecuta justo antes del commit.
git add .
git commit -m "%COMMIT_MSG%"
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] El commit ha fallado. Revisa los mensajes de Git.
    color 0C
    goto :END
)

:: --- PASO 3: SINCRONIZACION CON GITHUB ---
echo.
echo  [PASO 3] Sincronizando con el repositorio de GitHub...
echo  [INFO] Intentando descargar cambios remotos (git pull)...
git pull origin %GIT_BRANCH%
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] El 'git pull' ha fallado. Puede haber un conflicto de fusion.
    color 0C
    goto :END
)

echo.
echo  [INFO] Intentando subir cambios locales (git push)...
git push origin %GIT_BRANCH%
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] La subida a GitHub ha fallado.
    color 0C
    goto :END
)

:: --- PASO 4: CONFIRMACION FINAL Y DESPLIEGUE ---
echo.
echo  [PASO 4] Preparando despliegue a Firebase...
echo.
echo  [IMPORTANTE] Asegurate de haber ejecutado 'npm run build' si hiciste cambios.
echo.
set /p DEPLOY_CONFIRM= [ACCION REQUERIDA] ¿Desplegar la nueva version a '%FIREBASE_PROJECT%'? (S/N): 
if /i not "%DEPLOY_CONFIRM%"=="S" (
    echo.
    echo  [INFO] Despliegue cancelado por el usuario.
    goto :END
)

echo.
echo  [INFO] Confirmado. Desplegando en Firebase...
firebase deploy --only hosting --project %FIREBASE_PROJECT%
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] El despliegue a Firebase ha fallado.
    color 0C
    goto :END
)

echo.
echo  [EXITO] ¡Despliegue completado con exito!
color 0A

:: --- FINALIZACION ---
:END
echo.
echo  =================================================================
echo    PROCESO FINALIZADO.
echo  =================================================================
echo.
pause
