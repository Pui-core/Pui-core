# 指定Naturalの正式Core描画・今回音声への同期：実行済み

旧revision-01の「Core Java jarが全ドライブに無い・追加提供待ち」という説明は誤りでした。既設の正式Core/JNIを使って、今回の7句の元WAVから音量包絡を読み取り、画面に表示する冒頭0–5.6秒と締め26–30秒の288フレームを新規描画しました。117の口形を今回の声へ流用していません。

- Core：`C:\Program Files\Live2D Cubism 5.3\app\lib\Live2DCubismCore.jar`
- Native：同`app\dll64\Live2DCubismCoreJNI.dll`
- 実行：同`app\jre\bin\java.exe`。コンパイルは既設JDKの`javac.exe --release 17`。
- 指定原本：`F:\Users\pui\Desktop\model\SeeThrough-workflows\Revenant_Natural`。元MOC/manifest/textureはSHA不変。
- 結果：`model-native-render.json` exit0、`model-binding.json`、`model-alpha-bounds.json`、`media/natural.mov`。600×780/30fps/alpha、288f/9.6秒。
- 合成：modelはアプリ画像の外側の左レーンに配置し、額・花・日記・日付・重要字幕を隠さない。

公式Coreの実geometryを使ったソフトウェアtriangle/mask描画です。カメラ追跡・VTube Studio・物理シミュレーションの収録とは称しません。元MOC/atlas/SDKの再配布はしません。旧rev01と原票は保持しています。
