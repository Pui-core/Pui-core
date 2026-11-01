// Private task launcher. All descendants are owned by a kill-on-close Windows Job.
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

class Runner {
    const uint STARTF_USESTDHANDLES=0x100, CREATE_SUSPENDED=4, SYNCHRONIZE=0x100000;
    const uint JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE=0x2000, WAIT_OBJECT_0=0, WAIT_TIMEOUT=258;
    [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Unicode)] struct STARTUPINFO {
        public int cb; public string reserved, desktop, title; public int x,y,xSize,ySize,xChars,yChars,fill,flags; public short show,reserved2; public IntPtr reservedPtr,stdin,stdout,stderr;
    }
    [StructLayout(LayoutKind.Sequential)] struct PROCESS_INFORMATION {public IntPtr process,thread; public uint pid,tid;}
    [StructLayout(LayoutKind.Sequential)] struct BASIC_LIMIT {public long perProcess,perJob;public uint flags;public UIntPtr minWorking,maxWorking;public uint activeLimit;public UIntPtr affinity;public uint priority,scheduling;}
    [StructLayout(LayoutKind.Sequential)] struct IO_COUNTERS {public ulong readOps,writeOps,otherOps,readBytes,writeBytes,otherBytes;}
    [StructLayout(LayoutKind.Sequential)] struct EXTENDED_LIMIT {public BASIC_LIMIT basic;public IO_COUNTERS io;public UIntPtr processMemory,jobMemory,peakProcess,peakJob;}
    [StructLayout(LayoutKind.Sequential)] struct ACCOUNTING {public long user,kernel,periodUser,periodKernel;public uint faults,total,active,terminated;}
    [DllImport("kernel32.dll",SetLastError=true,CharSet=CharSet.Unicode)] static extern IntPtr CreateJobObject(IntPtr a,string name);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool SetInformationJobObject(IntPtr job,int cls,ref EXTENDED_LIMIT info,uint size);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool QueryInformationJobObject(IntPtr job,int cls,out ACCOUNTING info,uint size,IntPtr returned);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool AssignProcessToJobObject(IntPtr job,IntPtr process);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool TerminateJobObject(IntPtr job,uint code);
    [DllImport("kernel32.dll",SetLastError=true,CharSet=CharSet.Unicode)] static extern bool CreateProcess(string app,StringBuilder cmd,IntPtr pa,IntPtr ta,bool inherit,uint flags,IntPtr env,string cwd,ref STARTUPINFO si,out PROCESS_INFORMATION pi);
    [DllImport("kernel32.dll",SetLastError=true)] static extern uint ResumeThread(IntPtr thread);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool TerminateProcess(IntPtr process,uint code);
    [DllImport("kernel32.dll",SetLastError=true)] static extern IntPtr OpenProcess(uint access,bool inherit,uint pid);
    [DllImport("kernel32.dll",SetLastError=true)] static extern uint WaitForMultipleObjects(uint count,IntPtr[] handles,bool all,uint ms);
    [DllImport("kernel32.dll",SetLastError=true)] static extern uint WaitForSingleObject(IntPtr handle,uint ms);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool GetExitCodeProcess(IntPtr process,out uint code);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool CloseHandle(IntPtr handle);
    [DllImport("kernel32.dll")] static extern IntPtr GetStdHandle(int which);
    static void Check(bool ok,string what) {if(!ok)throw new Win32Exception(Marshal.GetLastWin32Error(),what);}
    static string Quote(string s) {var b=new StringBuilder("\"");int slashes=0;foreach(char c in s){if(c=='\\'){slashes++;continue;}if(c=='\"'){b.Append('\\',slashes*2+1);b.Append(c);}else{b.Append('\\',slashes);b.Append(c);}slashes=0;}b.Append('\\',slashes*2);return b.Append('"').ToString();}
    static int Main(string[] args) {
        IntPtr job=IntPtr.Zero,parent=IntPtr.Zero; PROCESS_INFORMATION pi=new PROCESS_INFORMATION();bool assigned=false;
        try {
            if(args.Length<2)throw new ArgumentException("parent pid and executable required");
            parent=OpenProcess(SYNCHRONIZE,false,uint.Parse(args[0]));if(parent==IntPtr.Zero||WaitForSingleObject(parent,0)!=WAIT_TIMEOUT)throw new Exception("parent unavailable");
            job=CreateJobObject(IntPtr.Zero,null);if(job==IntPtr.Zero)throw new Win32Exception(Marshal.GetLastWin32Error());
            var limits=new EXTENDED_LIMIT();limits.basic.flags=JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;Check(SetInformationJobObject(job,9,ref limits,(uint)Marshal.SizeOf(limits)),"job limit");
            var si=new STARTUPINFO();si.cb=Marshal.SizeOf(si);si.flags=(int)STARTF_USESTDHANDLES;si.stdin=GetStdHandle(-10);si.stdout=GetStdHandle(-11);si.stderr=GetStdHandle(-12);
            var command=new StringBuilder();for(int i=1;i<args.Length;i++){if(i>1)command.Append(' ');command.Append(Quote(args[i]));}
            Check(CreateProcess(args[1],command,IntPtr.Zero,IntPtr.Zero,true,CREATE_SUSPENDED,IntPtr.Zero,null,ref si,out pi),"create process");
            Check(AssignProcessToJobObject(job,pi.process),"assign job");assigned=true;
            if(ResumeThread(pi.thread)==0xffffffff)throw new Win32Exception(Marshal.GetLastWin32Error(),"resume");
            uint state=WaitForMultipleObjects(2,new[]{pi.process,parent},false,0xffffffff);
            if(state==WAIT_OBJECT_0+1){TerminateJobObject(job,1);return 125;}
            if(state!=WAIT_OBJECT_0)throw new Win32Exception(Marshal.GetLastWin32Error(),"wait");
            uint exit;Check(GetExitCodeProcess(pi.process,out exit),"exit code");
            ACCOUNTING info;for(int i=0;;i++){Check(QueryInformationJobObject(job,1,out info,(uint)Marshal.SizeOf(typeof(ACCOUNTING)),IntPtr.Zero),"job accounting");if(info.active==0||i>=40)break;Thread.Sleep(50);}
            if(info.active!=0){TerminateJobObject(job,1);Console.Error.WriteLine("OWNED_DESCENDANTS_REMAIN");return 126;}
            return exit==0?0:1;
        } catch(Exception e) {if(pi.process!=IntPtr.Zero&&!assigned)TerminateProcess(pi.process,1);Console.Error.WriteLine("JOB_RUNNER_ERROR: "+e.Message);return 127;}
        finally {if(pi.thread!=IntPtr.Zero)CloseHandle(pi.thread);if(pi.process!=IntPtr.Zero)CloseHandle(pi.process);if(job!=IntPtr.Zero)CloseHandle(job);if(parent!=IntPtr.Zero)CloseHandle(parent);}
    }
}
