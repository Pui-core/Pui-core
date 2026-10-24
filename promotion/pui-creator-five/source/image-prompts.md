# 本人ブランド用マスコット差分

参照原画: ../media/icon-original.png （公式 https://pui-wobbfet.top/images/logos/icon-512.png）。公式原画と採用ピースPNGを保持。2026-10-24、builtin image_genで原画を参照し生成。

## ピース / mascot-peace.png

採用画像: `../media/mascot-peace.png`

生成原本: `/home/pui/.codex/generated_images/01a16c97-cf93-78c0-878f-887ea7249680/exec-e2a06833-5b92-4caf-8de9-a43e9f15f157.png`

```
Use case: identity-preserve
Asset type: single transparent mascot pose cutout for a kinetic Japanese vertical promotional video.
Input image 1 is the EDIT TARGET: the official Pui light-blue water mascot. Preserve this precise character identity, rounded body, face design, palette and watercolor illustration style.
Primary request: Give this exact mascot a cheerful, confident V-sign peace gesture. Remove its blue browser/tablet and yellow globe to free the hands, and remove the ground puddle. One raised hand on viewer-right, next to but not covering its face, makes a clearly legible peace V sign with exactly TWO rounded watery fingers and a little curled rounded mitten palm. Its other arm on viewer-left is bent with its simple rounded hand on its hip, a confident, playful posture.
Subject: single plump watery light-blue creature, broad pear-shaped/oval body matching reference, long curved droplet antenna toward upper viewer-right, crisp navy-blue organic outline with narrow brighter-blue rim, soft pink cheeks, closed happy crescent eyes, reference-style small open smiling mouth with pink interior, tiny rounded feet. Preserve translucent cool water texture, white glossy highlights, and pale belly.
Style: hand-illustrated watercolor texture matching input, polished expressive cartoon, no realistic hands, no 3D, no vector simplification.
Composition: portrait 1024x1536, full body in frame, mascot about 75 percent canvas height with generous transparent margins. Keep broad plump body proportions; do not elongate body to fit portrait frame. Both arm tips, BOTH feet and whole droplet antenna visible with clearance.
Background: actual transparent alpha cutout, empty outside silhouette. NO blue aura, NO bloom, NO glow, NO background color, NO ground shadow or puddle, NO checkerboard.
Constraints: exactly two arms, two small feet, one droplet antenna; only the raised peace hand has two clear V fingers, hand-on-hip is one rounded mitten. No extra finger, no extra arm, no props, no laptop, no globe, no clothing, no text or logo, no other character. Preserve exact mascot identity. One pose only, not a contact sheet.
```

確認: 1024×1536 RGBA。alpha min 0 / max 254、完全透過画素 45.8778%。V字の2本指、2腕2足、目・ほお・しずく触角・水彩質感を目視。右手が画像右端へ近く、alpha 128以上の外接矩形は [6, 140, 1022, 1392]。動画ではPNGを少し縮小して余白を設ける。原画の小物・床影なし。プレビューでは青い縁が見えるため、実背景上でも確認する。

### raw result metadata（画像のbase64本体を除く）

```json
{
  "image_url": "[PNG binary omitted; original PNG retained at path above]",
  "output_hint": "Generated images are saved to /home/pui/.codex/generated_images/01a16c97-cf93-78c0-878f-887ea7249680 as /home/pui/.codex/generated_images/01a16c97-cf93-78c0-878f-887ea7249680/exec-e2a06833-5b92-4caf-8de9-a43e9f15f157.png by default.\nIf you need to use a generated image at another path, copy it and leave the original in place unless the user explicitly asks you to delete it.\nThe generated image is already displayed to the user. There is no need to render it in the final response as a Markdown image or file link."
}
```
