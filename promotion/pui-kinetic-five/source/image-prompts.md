# Pui 5本用・生成画像プロンプト

制作日: 2026-10-24

使用モード: builtin image_gen。外部 API・CLI・API キーは使用していない。

参照原画: `../media/icon-original.png`（Pui公式サイトのマスコット）。参照原画は保持。

## 指さし / mascot-point.png

採用画像: `../media/mascot-point.png`

生成原本: `/home/pui/.codex/generated_images/01a16c97-cf93-78c0-878f-887ea7249680/exec-5f1106c7-7777-4e2f-a9aa-d2157e6955a7.png`

```
Use case: identity-preserve
Asset type: transparent character pose cutout for kinetic Japanese vertical promotional video.
Input image 1 is the EDIT TARGET and the exact identity/style reference: the official Pui light-blue water mascot.
Primary request: Redraw this exact mascot in a single energetic pointing pose, pointing diagonally toward the upper LEFT of the viewer. Remove its browser/tablet and yellow globe to free the hands, and remove the blue ground-shadow puddle. Retain the mascot's exact identity and illustrated watercolor quality.
Subject: one plump light-blue watery mascot, same broad pear/oval body, large droplet antenna curving up toward viewer-right, navy blue outlines with lighter-blue rim, soft pink blush, two closed happy crescent eyes, small cheerful open mouth with pink interior, glossy water highlights and textured pale-cyan belly. Same tiny rounded feet as reference.
Gesture: mascot's arm on the viewer-left side extends distinctly diagonally upper-left, with one clear rounded pointing digit, its small thumb and remaining digits naturally curled into one simple cartoon mitten. The other arm is relaxed beside its body, a simple rounded mitten. Exactly TWO arms and TWO feet. The arm and pointer are visibly connected to the body, easy to read at phone size.
Composition/framing: full character only, entire droplet antenna, hands, pointing fingertip and feet comfortably inside canvas, generous transparent margin around extremities. Portrait 1024x1536 composition, mascot occupies about 76 percent of canvas height, centered slightly right to accommodate the extended pointing arm. Keep broad plump proportions; do not elongate body to fill portrait canvas.
Scene/backdrop: true transparent alpha, no backdrop, no floor, no puddle, no ground shadow plate, no fake checkerboard.
Style/medium: match the reference exactly: charming hand-illustrated watercolor water creature with crisp dark-blue organic outlines, cool translucent water, soft white highlights. Not 3D and not flat vector.
Constraints: no text, no logo, no props, no extra character, no clothes, no yellow globe, no laptop/tablet. No human hands or many articulated fingers. Maintain recognizable reference face and antenna. Only alter arms/pose as needed and remove the two props and ground shadow. One standalone pose, not a collage.
```

確認: 1024×1536 RGBA。alpha min 0 / max 254、完全透過画素 52.9739%。画面左上へ指さし、2本の腕・2足・しずく触角・顔・水彩の水色表現を目視。指先・手足の切れなし。元のノートPC・地球・床の水たまりなし。暗色の縁は透過領域に沿う青いフリンジで、背景板ではない。

### raw result metadata（画像のbase64本体を除く）

```json
{
  "image_url": "[PNG binary omitted; original PNG retained at path above]",
  "output_hint": "Generated images are saved to /home/pui/.codex/generated_images/01a16c97-cf93-78c0-878f-887ea7249680 as /home/pui/.codex/generated_images/01a16c97-cf93-78c0-878f-887ea7249680/exec-5f1106c7-7777-4e2f-a9aa-d2157e6955a7.png by default.\nIf you need to use a generated image at another path, copy it and leave the original in place unless the user explicitly asks you to delete it.\nThe generated image is already displayed to the user. There is no need to render it in the final response as a Markdown image or file link."
}
```

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

## 驚き / mascot-shock.png

採用画像: `../media/mascot-shock.png`

生成原本: `/home/pui/.codex/generated_images/01a16c97-cf93-78c0-878f-887ea7249680/exec-497d2432-ca69-457b-8bad-dabb0a94af45.png`

```
Use case: identity-preserve
Asset type: a single transparent mascot reaction cutout for an energetic vertical short video.
Input image 1 is the EDIT TARGET and exact identity/style reference: the official Pui water mascot.
Primary request: Make this same Pui mascot look adorably surprised: two simple open round navy eyes with tiny clean white catchlights, small round O-shaped mouth with pink interior, pink blush. Lift BOTH rounded watery mitten hands beside its cheeks with palms visible, communicating "wow!". Hands are simple round water-paddle mittens with a little rounded thumb each, not human articulated fingers. Exactly TWO arms and TWO small feet.
Remove the original browser/tablet, yellow globe, and the floor puddle so the hands are free. Preserve the original identity and body design: broad plump pale-blue watery pear/oval body, distinctive single long droplet antenna curving toward upper viewer-right, crisp navy hand-drawn outline with a narrow light-blue rim, white water highlights and soft watercolor texture, tiny rounded blue feet.
Composition/framing: full mascot isolated on transparent alpha, no floor. Portrait 1024x1536. Leave 10 percent CLEAR TRANSPARENT margin on the LEFT and RIGHT of the widest hands, as well as ample space above antenna and below feet. Character's full height should occupy roughly 72 percent of canvas; make the subject smaller in the frame so absolutely no limb touches the image edge. Body remains broad and chubby, not elongated.
Style/medium: same charming watercolor illustration and delicate white glossy water highlights as original; no 3D, no realistic skin or human hands. Preserve face placement and antenna design; change only facial expression, arms and remove props/puddle.
Background: actual empty transparent alpha. No blue aura, glow or halo, no colored backdrop, no drop shadow, no ground puddle, no checkerboard.
Constraints: One exact character only. No text/logos, no props/clothes, no browser/tablet, no globe, no extra arm/hand/feet/antenna, no sharp human fingers, no threatening or sad expression. Surprise is friendly and cute. One pose only, not a collage.
```

確認: 1024×1536 RGBA。alpha min 0 / max 254、完全透過画素 54.9524%。開いた2眼とO字の口、左右の丸いミトン手、2腕2足、触角・頬・水彩の水色表現を目視。手足・触角の切れなし。alpha128以上の外接矩形 [62, 199, 965, 1334]。原画の小物・床影なし。青い縁は他の差分と同様。

### raw result metadata（画像のbase64本体を除く）

```json
{
  "image_url": "[PNG binary omitted; original PNG retained at path above]",
  "output_hint": "Generated images are saved to /home/pui/.codex/generated_images/01a16c97-cf93-78c0-878f-887ea7249680 as /home/pui/.codex/generated_images/01a16c97-cf93-78c0-878f-887ea7249680/exec-497d2432-ca69-457b-8bad-dabb0a94af45.png by default.\nIf you need to use a generated image at another path, copy it and leave the original in place unless the user explicitly asks you to delete it.\nThe generated image is already displayed to the user. There is no need to render it in the final response as a Markdown image or file link."
}
```


