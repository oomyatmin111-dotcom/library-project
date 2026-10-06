Set WshShell = CreateObject("WScript.Shell")
strCurDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Run FastAPI silently in background (0 = hide window)
WshShell.Run "python -m uvicorn app:app --host 127.0.0.1 --port 8000", 0, False

' Wait 3 seconds then start cloudflared tunnel silently
WScript.Sleep 3000
WshShell.Run strCurDir & "\..\cloudflared.exe tunnel --url http://127.0.0.1:8000", 0, False
