@echo off
REM Browser MCP One-Liner Installer for Windows
REM This script automatically installs and configures Browser MCP

setlocal enabledelayedexpansion

echo.
echo ^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=
echo  Browser MCP Auto-Installer (Windows)
echo ^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=
echo.

REM Verify Node.js is available
echo Verifying Node.js installation...
where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js not found
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo OK Node.js !NODE_VERSION! found
echo.

REM Install companion app globally
echo Installing Browser MCP Companion App...
call npm install -g browser-mcp-companion
if errorlevel 1 (
    echo ERROR: Failed to install companion app
    pause
    exit /b 1
)
echo OK Companion app installed
echo.

REM Get the installed package path
for /f "tokens=*" %%i in ('npm root -g') do set NPM_ROOT=%%i
set "COMPANION_PATH=!NPM_ROOT!\browser-mcp-companion"
set "MCP_SERVER_PATH=!COMPANION_PATH!\mcp-server\dist\index.js"

REM Convert backslashes to forward slashes for JSON
set "MCP_SERVER_PATH_JSON=!MCP_SERVER_PATH:\=/!"

REM Verify MCP server exists
echo Verifying MCP server...
if not exist "!MCP_SERVER_PATH!" (
    echo ERROR: MCP server not found at !MCP_SERVER_PATH!
    echo Installation may have failed. Please check npm logs.
    pause
    exit /b 1
)
echo OK MCP server found
echo.

REM Ask which IDE to configure
echo Which IDE would you like to configure?
echo 1^) Claude Desktop
echo 2^) Cursor IDE
echo 3^) Both
echo.
set /p IDE_CHOICE="Enter choice (1-3): "
echo.

if "%IDE_CHOICE%"=="1" goto CLAUDE
if "%IDE_CHOICE%"=="2" goto CURSOR
if "%IDE_CHOICE%"=="3" goto BOTH
echo Invalid choice
pause
exit /b 1

:CLAUDE
call :CONFIGURE_CLAUDE
goto VERIFY

:CURSOR
call :CONFIGURE_CURSOR
goto VERIFY

:BOTH
call :CONFIGURE_CLAUDE
call :CONFIGURE_CURSOR
goto VERIFY

:CONFIGURE_CLAUDE
echo Configuring Claude Desktop...

set "CONFIG_DIR=%APPDATA%\Claude"
set "CONFIG_FILE=%CONFIG_DIR%\claude_desktop_config.json"

REM Create directory if it doesn't exist
if not exist "%CONFIG_DIR%" mkdir "%CONFIG_DIR%"

REM Backup existing config
if exist "%CONFIG_FILE%" (
    echo Backing up existing config...
    copy "%CONFIG_FILE%" "%CONFIG_FILE%.backup" >nul
    echo OK Backup saved
)

REM Create config file
(
echo {
echo   "mcpServers": {
echo     "browser-inspector": {
echo       "command": "node",
echo       "args": [
echo         "%MCP_SERVER_PATH_JSON%"
echo       ],
echo       "env": {
echo         "NODE_ENV": "production"
echo       }
echo     }
echo   }
echo }
) > "%CONFIG_FILE%"

echo OK Claude Desktop configured
echo    Config: %CONFIG_FILE%
echo.
exit /b 0

:CONFIGURE_CURSOR
echo Configuring Cursor IDE...

set "CONFIG_DIR=%USERPROFILE%\.cursor"
set "CONFIG_FILE=%CONFIG_DIR%\mcp.json"

REM Create directory if it doesn't exist
if not exist "%CONFIG_DIR%" mkdir "%CONFIG_DIR%"

REM Backup existing config
if exist "%CONFIG_FILE%" (
    echo Backing up existing config...
    copy "%CONFIG_FILE%" "%CONFIG_FILE%.backup" >nul
    echo OK Backup saved
)

REM Create config file
(
echo {
echo   "mcpServers": {
echo     "browser-inspector": {
echo       "command": "node",
echo       "args": [
echo         "%MCP_SERVER_PATH_JSON%"
echo       ],
echo       "env": {
echo         "NODE_ENV": "production"
echo       }
echo     }
echo   }
echo }
) > "%CONFIG_FILE%"

echo OK Cursor IDE configured
echo    Config: %CONFIG_FILE%
echo.
exit /b 0

:VERIFY
REM Verify Node.js installation
echo Verifying Node.js installation...
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo OK Node.js %NODE_VERSION% found
echo.

REM Test MCP server
echo Testing MCP server...
node "%MCP_SERVER_PATH%" --help >nul 2>&1
echo OK MCP server verified
echo.

REM Final instructions
echo ^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=
echo  Installation Complete!
echo ^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=
echo.
echo Next Steps:
echo.

if "%IDE_CHOICE%"=="1" echo 1. Restart Claude Desktop (Quit completely and reopen)
if "%IDE_CHOICE%"=="2" echo 1. Restart Cursor IDE (Quit completely and reopen)
if "%IDE_CHOICE%"=="3" (
    echo 1. Restart Claude Desktop (Quit completely and reopen)
    echo 2. Restart Cursor IDE (Quit completely and reopen)
)

echo.
echo 2. Install the Chrome extension:
echo    - Open chrome://extensions/
echo    - Enable 'Developer mode'
echo    - Click 'Load unpacked'
echo    - Select: %SCRIPT_DIR%extension-chromium\dist
echo.
echo 3. Start the companion app:
echo    cd %SCRIPT_DIR%companion-app ^&^& node index.js
echo.
echo 4. Connect a browser tab and start using Browser MCP!
echo.
echo ^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=
echo.
echo Your AI assistant now has browser inspection powers!
echo.
pause
