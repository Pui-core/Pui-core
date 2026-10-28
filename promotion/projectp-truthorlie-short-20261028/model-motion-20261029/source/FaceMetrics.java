import javax.imageio.ImageIO;import java.nio.file.*;import java.util.*;
public class FaceMetrics {
 static int dark(java.awt.image.BufferedImage image,int x,int y,int w,int h){int count=0;for(int j=y;j<y+h;j++)for(int i=x;i<x+w;i++){int p=image.getRGB(i,j),r=(p>>>16)&255,g=(p>>>8)&255,b=p&255;if(.2126*r+.7152*g+.0722*b<150)count++;}return count;}
 public static void main(String[]args)throws Exception{List<String>rows=new ArrayList<>();for(int i=1;i<=64;i++){var image=ImageIO.read(Path.of(args[0],String.format("face-%03d.png",i)).toFile());if(image.getWidth()!=120||image.getHeight()!=120)throw new IllegalStateException("Expected120px final face ROI");rows.add("{\"globalFrame\":"+(511+i)+",\"mouthDarkPixels\":"+dark(image,49,67,24,16)+",\"eyesDarkPixels\":"+dark(image,25,41,70,24)+"}");}Files.writeString(Path.of(args[1]),"{\"frames\":["+String.join(",",rows)+"],\"mouthRoiInCrop\":[49,67,24,16],\"eyesRoiInCrop\":[25,41,70,24],\"lumaThreshold\":150}");}
}
