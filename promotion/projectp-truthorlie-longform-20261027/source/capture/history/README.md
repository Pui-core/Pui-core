# 不採用の旧pilot（保持用・実行しない）

pilot-rejected-01.rbは旧source/capture/pilot.rbをbyteそのままで保持した履歴です。端末初期作成と8秒のrecord開始後にUI testをする古い工程で、白1フレームpilot01の経路です。採用captureや現在の実行入口ではなく、再実行しません。

現在の正本は1階層上のrun-ui-capture.shとCaptureTests.swift。専用UDIDだけを操作し、実testCount1/失敗0/対象method passed/recorder正常finalizeを必須にします。0testのexit0を成功扱いにする旧経路は不採用です。
