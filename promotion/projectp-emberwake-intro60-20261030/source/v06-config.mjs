// v06 (Issue156 RC-156-02): cue07の声/字幕を点灯後へ移す限定修正の共通設定。
// srcRoot はv05一式(RO)、caseRoot は新しいLinux私的case。F元ファイル/旧NASは上書きしない。
export const srcRoot='/mnt/f/Videos/ProjectP-EMBERWAKE-Intro60-2026-10-30/intro65-v01';
export const caseRoot='/home/pui/private-use/projectp156-v06-case-20261031';
export const fps=30;
// 最終MP4/原素材の30fps連続frameで確定した点灯の最初のframe(0始まり)。522=未点灯, 523=点灯。
export const lampFrame=523;
export const lampSeconds=lampFrame/fps; // 17.4333...
export const cue07At=17.46; // 有声開始=at+0.0403125=17.5003秒(点灯の約2frame後)。WAV再生成なし。
export const captionOut=567/fps; // 18.9秒: 結果字幕の終端、スイッチ副行の開始
