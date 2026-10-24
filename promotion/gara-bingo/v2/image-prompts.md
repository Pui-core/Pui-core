# V2のポーズ生成

組み込み `image_gen` を使用。CLI/APIへの切替なし。入力はV1の `media/character-cutout.png`。両方を真のアルファ付き887×1774 PNGで保存し、動画には同一キャラクターのポーズ差分として使用する。微細な服・髪の形の変化を、元画像と画素単位で一致した素材とは扱わない。

納品先：`editable/media/character-point.png`、`editable/media/character-peace.png`。V1の基本ポーズとステージ背景も保持する。

## 指さし

Use case: identity-preserve. Asset type: transparent animation pose for a vertical TikTok video, the exact SAME original anime VTuber girl in Image 1. Create ONE full-body pose variation. She leans forward playfully, raises her right arm and extends it clearly toward SCREEN LEFT, pointing one index finger left to direct attention to a text card. Her other hand rests casually near her hip. Expression: confident cute smile, both violet starry eyes open. Preserve the exact facial identity, mint blue twin buns and two long braids, black X hairclip, pink hair clips, black heart choker, black white mint cropped jacket and outfit, skirt, thigh accessories, asymmetrical boots, body proportions and polished illustration style from the reference. Anatomically correct hands, five fingers per hand, index finger unmistakable. The pose must feel lively and deliberate. Entire head to feet visible, no crop, a little transparent margin. TRUE transparent alpha background, no background, no shadow, no lettering, no accessories added, no redesign. Same camera height and frontal body angle as the source, only expression and arm/body pose change.

## ピース

Use case: identity-preserve. Asset type: transparent full-body animation pose for a vertical TikTok music video. Image 1 shows the exact character to preserve. Make ONE pose variation of this SAME anime VTuber girl: lively three-quarter weight shift and a cheerful confident smile, her left hand raised BESIDE her face making a clear V peace sign with index and middle fingers, palm facing viewer; her other hand open at waist height as if presenting a live show. Keep both violet starry eyes open. Preserve exact face, mint blue twin buns with long braided twintails, black X hairclip and pink clips, black heart choker, black white mint cropped jacket, black/white skirt outfit, thigh accessories and asymmetrical boots. Keep her original body proportions and detailed anime illustration quality. Correct hands with five fingers, clean peace sign. Full body head through soles, all fingers and shoes inside frame with transparent margin. Genuine transparent alpha background. No backdrop, shadow, lettering, extra props or costume changes. Match the original linework, colors and shading. Do not create a different person.
