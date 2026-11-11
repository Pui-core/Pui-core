// SPDX-License-Identifier: MIT
// Based on live2d-agent-kit render_core.java, Copyright (c) 2026 Ariakage.
// Full MIT notice: live2d-renderer-LICENSE.txt. Actual official Core geometry;
// local software triangle rasterization, not VTS/physics/camera capture.
import com.live2d.sdk.cubism.core.*;import javax.imageio.ImageIO;import java.awt.*;import java.awt.geom.*;import java.awt.image.BufferedImage;import java.nio.file.*;import java.util.*;import java.util.List;
public class AvatarCore {
static CubismDrawableView[] drawables;static List<BufferedImage> textures=new ArrayList<>();static int width=600,height=780;static Color background=null;static double scale=600.0/2800,pixelsPerUnit,originX,originY,canvasHeight,margin=0;static Map<String,BufferedImage> masks=new HashMap<>();
public static void main(String[]a)throws Exception{
Path modelPath=Path.of(a[0]),frames=Path.of(a[3]);Files.createDirectories(frames);textures.add(ImageIO.read(Path.of(a[1]).toFile()));textures.add(ImageIO.read(Path.of(a[2]).toFile()));byte[]bytes=Files.readAllBytes(modelPath);if(!Live2DCubismCore.hasMocConsistency(bytes))throw new IllegalStateException("Core consistency failed");
try(CubismMoc moc=CubismMoc.instantiate(bytes);CubismModel model=moc.instantiateModel()){
drawables=model.getDrawableViews();var c=model.getCanvasInfo();pixelsPerUnit=c.getPixelsPerUnit();originX=c.getOriginInPixels()[0]-772;originY=c.getOriginInPixels()[1];canvasHeight=c.getSizeInPixels()[1]+100;
String[]ids={"ParamMouthOpenY","ParamEyeLOpen","ParamEyeROpen","ParamAngleX","ParamAngleY","ParamAngleZ","ParamBodyAngleX","ParamBreath"};
for(String id:ids)if(model.findParameterView(id)==null)throw new IllegalArgumentException("Missing native parameter "+id);
int count=0;long start=System.nanoTime();for(String row:Files.readAllLines(Path.of(a[4]))){if(row.isBlank()||row.startsWith("frame"))continue;String[]v=row.split(",");int frame=(int)Double.parseDouble(v[0]);for(var p:model.getParameterViews())p.setValue(p.getDefaultValue());for(int i=0;i<ids.length;i++){var p=model.findParameterView(ids[i]);float value=Float.parseFloat(v[i+1]);if(value<p.getMinimumValue()||value>p.getMaximumValue())throw new IllegalArgumentException("Parameter outside native bounds "+ids[i]);p.setValue(value);}model.update();
for(var d:drawables){if(d.getBlendMode()!=0||(d.getConstantFlag()&8)!=0)throw new IllegalStateException("Unsupported blend/mask "+d.getId());for(int i=0;i<3;i++)if(Math.abs(d.getMultiplyColors()[i]-1)>1e-6||Math.abs(d.getScreenColors()[i])>1e-6)throw new IllegalStateException("Unsupported color "+d.getId()+" "+Arrays.toString(d.getMultiplyColors())+"/"+Arrays.toString(d.getScreenColors()));for(float q:d.getVertexPositions())if(!Float.isFinite(q))throw new IllegalStateException("Nonfinite geometry");}
ImageIO.write(renderFrame(model),"PNG",frames.resolve(String.format("frame-%06d.png",frame)).toFile());count++;if(count%30==0)System.out.println("Native Core rendered "+count+" frames / "+((System.nanoTime()-start)/1e9)+"s");}
System.out.println("Rendered "+count+" true Core frames, "+width+"x"+height+", no physics simulation; Core="+Live2DCubismCore.getVersion());}}
    static String optionValue(String[] args,int index) {
        if(index>=args.length)throw new IllegalArgumentException("Missing value for "+args[index-1]);
        return args[index];
    }
    static double pulse(double t,double center,double width) { double x=Math.abs(t-center);return x>=width?0:(1+Math.cos(Math.PI*x/width))/2; }
    static CubismParameterView parameter(CubismModel model,String id,String legacy) { CubismParameterView p=model.findParameterView(id);return p!=null?p:model.findParameterView(legacy); }
    static void animate(CubismModel model,String id,String legacy,double normalized) {
        CubismParameterView p=parameter(model,id,legacy);if(p==null)return;
        float d=p.getDefaultValue();p.setValue((float)(d+normalized*(normalized>=0?p.getMaximumValue()-d:d-p.getMinimumValue())));
    }
    static void fraction(CubismModel model,String id,String legacy,double fraction) {
        CubismParameterView p=parameter(model,id,legacy);if(p!=null)p.setValue((float)(p.getMinimumValue()+(p.getMaximumValue()-p.getMinimumValue())*fraction));
    }
    static BufferedImage renderFrame(CubismModel model) {
            masks.clear();
            BufferedImage frame=blank();Graphics2D g=graphics(frame);
            if(background!=null){g.setColor(background);g.fillRect(0,0,width,height);}
            Integer[] order=new Integer[drawables.length];for(int i=0;i<order.length;i++)order[i]=i;
            int[] renderOrders=model.getRenderOrders();
            Arrays.sort(order,Comparator.comparingInt(i->renderOrders.length==drawables.length?renderOrders[i]:drawables[i].getDrawOrder()));
            for(int index:order) {
                CubismDrawableView d=drawables[index];
                if(d.getOpacity()<=0)continue;
                if(d.getTextureIndex()<0||d.getTextureIndex()>=textures.size())throw new IllegalArgumentException("Missing texture index "+d.getTextureIndex());
                BufferedImage layer=blank();Graphics2D layerGraphics=graphics(layer);
                layerGraphics.setComposite(AlphaComposite.SrcOver.derive(Math.max(0,Math.min(1,d.getOpacity()))));
                paintTriangles(layerGraphics,d);
                if(d.getMasks().length>0) {
                    String key=Arrays.toString(d.getMasks());BufferedImage mask=masks.get(key);
                    if(mask==null) {
                        mask=blank();Graphics2D mg=graphics(mask);
                        for(int maskIndex:d.getMasks()) {
                            if(maskIndex<0 || maskIndex>=drawables.length)throw new IllegalStateException("Invalid mask index in "+d.getId());
                            paintTriangles(mg,drawables[maskIndex]);
                        }
                        mg.dispose();masks.put(key,mask);
                    }
                    boolean inverted=(d.getConstantFlag()&CubismDrawableFlag.ConstantFlag.IS_INVERTED_MASK)!=0;
                    layerGraphics.setComposite(inverted?AlphaComposite.DstOut:AlphaComposite.DstIn);
                    layerGraphics.drawImage(mask,0,0,null);
                }
                layerGraphics.dispose();g.drawImage(layer,0,0,null);
            }
            g.dispose();
            return frame;
    }
    static BufferedImage blank(){return new BufferedImage(width,height,BufferedImage.TYPE_INT_ARGB);}
    static Graphics2D graphics(BufferedImage image) {
        Graphics2D g=image.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION,RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        // Binary triangle clips avoid translucent cracks along internal mesh edges.
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING,RenderingHints.VALUE_ANTIALIAS_OFF);
        return g;
    }
    static void paintTriangles(Graphics2D g,CubismDrawableView d) {
        int textureIndex=d.getTextureIndex();if(textureIndex<0||textureIndex>=textures.size())return;
        BufferedImage texture=textures.get(textureIndex);
        float[] v=d.getVertexPositions(),uv=d.getVertexUvs();short[] indices=d.getIndices();
        for(int i=0;i+2<indices.length;i+=3) {
            int ia=Short.toUnsignedInt(indices[i])*2,ib=Short.toUnsignedInt(indices[i+1])*2,ic=Short.toUnsignedInt(indices[i+2])*2;
            if(Math.max(ia,Math.max(ib,ic))+1>=v.length || Math.max(ia,Math.max(ib,ic))+1>=uv.length)throw new IllegalStateException("Invalid vertex/UV index in "+d.getId());
            for(int p:new int[]{ia,ib,ic})if(!Float.isFinite(v[p]) || !Float.isFinite(v[p+1]) || !Float.isFinite(uv[p]) || !Float.isFinite(uv[p+1]))throw new IllegalStateException("Non-finite vertex/UV in "+d.getId());
            double ax=(margin+originX+v[ia]*pixelsPerUnit)*scale,ay=(margin+canvasHeight-originY-v[ia+1]*pixelsPerUnit)*scale;
            double bx=(margin+originX+v[ib]*pixelsPerUnit)*scale,by=(margin+canvasHeight-originY-v[ib+1]*pixelsPerUnit)*scale;
            double cx=(margin+originX+v[ic]*pixelsPerUnit)*scale,cy=(margin+canvasHeight-originY-v[ic+1]*pixelsPerUnit)*scale;
            double ta=uv[ia]*texture.getWidth(),sa=(1-uv[ia+1])*texture.getHeight();
            double tb=uv[ib]*texture.getWidth(),sb=(1-uv[ib+1])*texture.getHeight();
            double tc=uv[ic]*texture.getWidth(),sc=(1-uv[ic+1])*texture.getHeight();
            double det=(tb-ta)*(sc-sa)-(tc-ta)*(sb-sa);if(Math.abs(det)<1e-10)continue;
            double m00=((bx-ax)*(sc-sa)-(cx-ax)*(sb-sa))/det;
            double m01=((cx-ax)*(tb-ta)-(bx-ax)*(tc-ta))/det;
            double m10=((by-ay)*(sc-sa)-(cy-ay)*(sb-sa))/det;
            double m11=((cy-ay)*(tb-ta)-(by-ay)*(tc-ta))/det;
            AffineTransform transform=new AffineTransform(m00,m10,m01,m11,ax-m00*ta-m01*sa,ay-m10*ta-m11*sa);
            Path2D triangle=new Path2D.Double();triangle.moveTo(ax,ay);triangle.lineTo(bx,by);triangle.lineTo(cx,cy);triangle.closePath();
            g.setClip(triangle);g.drawImage(texture,transform,null);
        }
        g.setClip(null);
    }
}
