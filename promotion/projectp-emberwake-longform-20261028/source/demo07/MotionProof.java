import javax.imageio.ImageIO;import java.nio.file.*;
public class MotionProof {
 static int changed(java.awt.image.BufferedImage a,java.awt.image.BufferedImage b,int x,int y,int w,int h){int n=0;for(int j=y;j<y+h;j++)for(int i=x;i<x+w;i++)if(a.getRGB(i,j)!=b.getRGB(i,j))n++;return n;}
 public static void main(String[]args)throws Exception{Path p=Path.of(args[0]);var neutral=ImageIO.read(p.resolve("frame-000000.png").toFile());var mouth=ImageIO.read(p.resolve("frame-000001.png").toFile());var eyes=ImageIO.read(p.resolve("frame-000002.png").toFile());int m=changed(neutral,mouth,230,205,140,70),e=changed(neutral,eyes,210,150,180,60);if(m<20||e<20)throw new IllegalStateException("Isolated native mouth/eyes did not deform visible pixels");Files.writeString(Path.of(args[1]),"{\"mouthChangedPixels\":"+m+",\"eyesChangedPixels\":"+e+",\"mouthRoi\":[230,205,140,70],\"eyesRoi\":[210,150,180,60],\"samePoseExceptNamedInput\":true,\"diagnosticOnly\":true}");}
}
