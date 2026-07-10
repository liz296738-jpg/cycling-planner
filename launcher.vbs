Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

strRoot = objFSO.GetParentFolderName(WScript.ScriptFullName)
nodePath = strRoot & "\nodejs\node.exe"

' Check bundled Node.js
If Not objFSO.FileExists(nodePath) Then
    nodePath = objShell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\nodejs\node-v22.14.0-win-x64\node.exe"
End If

If Not objFSO.FileExists(nodePath) Then
    MsgBox "Node.js not found!", 16, "AI Cycling Planner"
    WScript.Quit 1
End If

objShell.CurrentDirectory = strRoot
objShell.Run """" & nodePath & """ server\index.js", 0, False
