param(
 [switch]$Execute,
 [int]$ExpectedPid=0,
 [int]$ExpectedSession=0,
 [string]$ExpectedStart='',
 [long]$ExpectedHwnd=0,
 [int]$X=0,
 [int]$Y=0,
 [string]$TargetRect=''
)
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new($false)
if([IntPtr]::Size -ne 8){throw 'BIO98_REFUSED: This helper requires x64 Windows PowerShell.'}
if(-not ('ProjectPBioClick98' -as [type])){
 Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class ProjectPBioClick98 {
 [StructLayout(LayoutKind.Sequential)] public struct Mouse {
  public int x,y; public uint data,flags,time; public UIntPtr extra;
 }
 [StructLayout(LayoutKind.Explicit,Size=40)] public struct Input {
  [FieldOffset(0)] public uint type;
  [FieldOffset(8)] public Mouse mouse;
 }
 [StructLayout(LayoutKind.Sequential)] public struct Rect { public int left,top,right,bottom; }
 private static int inputCalls=0,cursorCalls=0;
 [DllImport("user32.dll",SetLastError=true)] private static extern uint SendInput(uint count,Input[] events,int size);
 [DllImport("user32.dll",SetLastError=true)] [return:MarshalAs(UnmanagedType.Bool)] private static extern bool SetCursorPos(int x,int y);
 [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] [return:MarshalAs(UnmanagedType.Bool)] public static extern bool GetWindowRect(IntPtr window,out Rect rect);
 public static Input[] CreateClick(){
  Mouse downMouse=new Mouse(); downMouse.flags=2;
  Mouse upMouse=new Mouse(); upMouse.flags=4;
  Input down=new Input(); down.type=0; down.mouse=downMouse;
  Input up=new Input(); up.type=0; up.mouse=upMouse;
  return new Input[]{down,up};
 }
 public static int InputSize(){return Marshal.SizeOf(typeof(Input));}
 public static int FlagsOffset(){return Marshal.OffsetOf(typeof(Input),"mouse").ToInt32()+Marshal.OffsetOf(typeof(Mouse),"flags").ToInt32();}
 public static byte[] Bytes(Input value){
  int size=InputSize(); byte[] bytes=new byte[size]; IntPtr pointer=Marshal.AllocHGlobal(size);
  try {Marshal.Copy(bytes,0,pointer,size);Marshal.StructureToPtr(value,pointer,false);Marshal.Copy(pointer,bytes,0,size);return bytes;}
  finally {Marshal.FreeHGlobal(pointer);}
 }
 public static bool MoveCursor(int x,int y){cursorCalls++;return SetCursorPos(x,y);}
 public static uint SendClick(Input[] events){inputCalls++;return SendInput((uint)events.Length,events,InputSize());}
 public static int InputCalls(){return inputCalls;}
 public static int CursorCalls(){return cursorCalls;}
}
'@
}
$events=[ProjectPBioClick98]::CreateClick()
$size=[ProjectPBioClick98]::InputSize()
$offset=[ProjectPBioClick98]::FlagsOffset()
$serialized=@(foreach($event in $events){
 $bytes=[ProjectPBioClick98]::Bytes($event)
 [pscustomobject]@{type=[BitConverter]::ToUInt32($bytes,0);flags=[BitConverter]::ToUInt32($bytes,$offset);hex=[BitConverter]::ToString($bytes).Replace('-','')}
})
if($size -ne 40 -or $offset -ne 20 -or $serialized.Count -ne 2 -or $serialized[0].type -ne 0 -or $serialized[1].type -ne 0 -or $serialized[0].flags -ne 2 -or $serialized[1].flags -ne 4){throw 'BIO98_REFUSED: Marshaled mouse click does not match the x64 INPUT contract.'}
if(-not $Execute){
 [pscustomobject]@{schemaVersion=1;mode='dry-run';pointerBytes=[IntPtr]::Size;inputSize=$size;flagsOffset=$offset;events=$serialized;inputApiCalled=([ProjectPBioClick98]::InputCalls() -gt 0);cursorOrFocusChanged=([ProjectPBioClick98]::CursorCalls() -gt 0);profileOutcome='not_checked'}|ConvertTo-Json -Depth 5 -Compress
 return
}
if($ExpectedPid -le 0 -or $ExpectedSession -le 0 -or $ExpectedHwnd -le 0 -or -not $ExpectedStart -or -not $TargetRect){throw 'BIO98_REFUSED: Execute requires current Firefox PID/session/start/HWND and the fresh Save rectangle.'}
try{
 $expectedTicks=[DateTime]::Parse($ExpectedStart,[Globalization.CultureInfo]::InvariantCulture,[Globalization.DateTimeStyles]::RoundtripKind).ToUniversalTime().Ticks
 $parts=$TargetRect.Split(',')
 if($parts.Count -ne 4){throw 'Invalid rectangle'}
 $rect=@(foreach($part in $parts){[double]::Parse($part,[Globalization.CultureInfo]::InvariantCulture)})
 if(@($rect|Where-Object {[double]::IsNaN($_) -or [double]::IsInfinity($_)}).Count -or $rect[2] -lt 8 -or $rect[3] -lt 8 -or $X -lt $rect[0] -or $X -ge $rect[0]+$rect[2] -or $Y -lt $rect[1] -or $Y -ge $rect[1]+$rect[3]){throw 'Point outside fresh Save rectangle'}
}catch{throw 'BIO98_REFUSED: Invalid expected start time or Save rectangle.'}
function Confirm-Target {
 $self=Get-Process -Id $PID
 $browser=Get-Process -Id $ExpectedPid -ErrorAction Stop
 if($self.SessionId -ne $ExpectedSession -or $browser.SessionId -ne $ExpectedSession -or $browser.ProcessName -ne 'firefox' -or $browser.StartTime.ToUniversalTime().Ticks -ne $expectedTicks -or $browser.MainWindowHandle.ToInt64() -ne $ExpectedHwnd -or $browser.MainWindowTitle -notlike '*TikTok*' -or [ProjectPBioClick98]::GetForegroundWindow().ToInt64() -ne $ExpectedHwnd){throw 'BIO98_REFUSED: Current Firefox identity/session/foreground mismatch.'}
 $window=[ProjectPBioClick98+Rect]::new()
 if(-not [ProjectPBioClick98]::GetWindowRect([IntPtr]$ExpectedHwnd,[ref]$window) -or $rect[0] -lt $window.left -or $rect[1] -lt $window.top -or $rect[0]+$rect[2] -gt $window.right -or $rect[1]+$rect[3] -gt $window.bottom){throw 'BIO98_REFUSED: Fresh Save rectangle is outside the expected Firefox window.'}
}
Confirm-Target
if(-not [ProjectPBioClick98]::MoveCursor($X,$Y)){throw 'BIO98_FAILED: Cursor positioning failed; SendInput was not called.'}
Confirm-Target
$accepted=[ProjectPBioClick98]::SendClick($events)
$nativeError=[Runtime.InteropServices.Marshal]::GetLastWin32Error()
[pscustomobject]@{schemaVersion=1;mode='execute';inputSize=$size;events=$serialized;identityVerified=$true;acceptedEvents=$accepted;inputApiCalled=$true;cursorMoved=$true;focusChangedByHelper=$false;automaticRetry=$false;profileOutcome='requires_reload_and_readback'}|ConvertTo-Json -Depth 5 -Compress
if($accepted -ne 2){throw "BIO98_FAILED: SendInput accepted $accepted of2 events; nativeError=$nativeError. Outcome may be partial; no automatic retry."}
