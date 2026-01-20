# デザインドキュメント

## 概要

QR Image Saverは、複数のQRコード画像を表示・保存するための完全にクライアントサイドで動作する静的HTMLページです。このシステムは、単一のHTMLファイル（埋め込みCSS/JavaScript）として実装され、Pages DropやEdgeOne Pagesなどの静的ホスティングサービスで動作します。

主な機能：
- レスポンシブなカードベースUI（スマートフォン最適化）
- 個別画像ダウンロード
- 一括画像ダウンロード（ブラウザブロック回避機能付き）
- iOS Safariなどのdownload属性非対応ブラウザへのフォールバック

## アーキテクチャ

### システム構成

```
┌─────────────────────────────────────┐
│         index.html                  │
│  ┌───────────────────────────────┐  │
│  │   <style> (CSS)               │  │
│  │   - レスポンシブレイアウト      │  │
│  │   - カードUIスタイル           │  │
│  │   - CSS変数（カスタマイズ用）  │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │   <body> (HTML構造)           │  │
│  │   - ヘッダー                  │  │
│  │   - QRリスト                  │  │
│  │   - フッター                  │  │
│  │   - 会社表記                  │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │   <script> (JavaScript)       │  │
│  │   - DownloadManager           │  │
│  │   - イベントハンドラー         │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 技術スタック

- **HTML5**: セマンティックマークアップ
- **CSS3**: Flexbox、CSS変数、メディアクエリ
- **Vanilla JavaScript**: DOM操作、ダウンロード管理

### デプロイメントモデル

静的ファイルとして配信され、CDN経由でグローバルに利用可能。サーバーサイド処理は不要。

## コンポーネントとインターフェース

### 1. HTMLマークアップ構造

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hardware Wallet QR</title>
  <style>/* CSS */</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <header class="header">
        <h1 class="title">Hardware Wallet QR</h1>
        <p class="subtitle">専用リンク、一度切りの利用となります。</p>
      </header>
      
      <div class="qr-list" id="qrList">
        <!-- QRアイテムが動的に生成される -->
      </div>
      
      <footer class="footer">
        <button class="btn-save-all" id="saveAllBtn">まとめて保存</button>
      </footer>
      
      <div class="divider"></div>
      
      <div class="company-info">
        <p>株式会社 bitFlyer</p>
        <p>暗号資産交換業者 関東財務局長 第00003号</p>
        <p>金融商品取引業者 関東財務局長（金商）第3294号</p>
        <p>所属する認定資金決済事業者協会かつ金融商品取引業協会　一般社団法人日本暗号資産等取引業協会</p>
        <p>© 2026 bitFlyer, Inc.</p>
      </div>
    </div>
  </div>
  <script>/* JavaScript */</script>
</body>
</html>
```

### 2. CSSスタイリングシステム

#### CSS変数（カスタマイズポイント）

```css
:root {
  /* 背景 */
  --bg-color: #f5f5f5;
  
  /* カード */
  --card-bg: #ffffff;
  --card-border-radius: 12px;
  --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --card-padding: 24px;
  --card-max-width: 720px;
  
  /* 行 */
  --row-height: 56px;
  --row-border: 1px solid #e0e0e0;
  --row-padding: 12px;
  
  /* テキスト */
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-small: 12px;
  --url-font-size: 14px;
  
  /* ボタン */
  --btn-bg: #007bff;
  --btn-color: #ffffff;
  --btn-border-radius: 6px;
  --btn-height: 44px;
  --btn-padding: 0 16px;
  
  /* フッター */
  --footer-text-size: 11px;
  --footer-text-color: #999999;
  --footer-line-height: 1.6;
}
```

#### レスポンシブブレークポイント

```css
/* スマートフォン（最優先） */
@media (max-width: 430px) {
  .card {
    width: min(92vw, 560px);
    padding: 16px;
  }
}

/* 極小画面（フォールバック） */
@media (max-width: 360px) {
  .qr-item {
    flex-wrap: wrap; /* 2行表示 */
  }
}

/* タブレット */
@media (min-width: 768px) {
  .card {
    width: 90vw;
    max-width: 720px;
  }
}

/* デスクトップ */
@media (min-width: 1024px) {
  .card {
    max-width: 900px;
  }
}
```

### 3. JavaScriptコンポーネント

#### DownloadManagerクラス

```javascript
class DownloadManager {
  constructor() {
    this.isDownloading = false;
    this.downloadDelay = 300; // 250-400msの中間値
  }
  
  /**
   * 個別画像をダウンロード
   * @param {string} url - 画像URL
   * @param {string} filename - 保存ファイル名
   */
  downloadSingle(url, filename) {
    // download属性をサポートするブラウザ
    if (this.supportsDownloadAttribute()) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // iOS Safariなどのフォールバック
      window.open(url, '_blank', 'noopener');
    }
  }
  
  /**
   * すべての画像を一括ダウンロード
   * @param {Array<{url: string, filename: string}>} items
   */
  async downloadAll(items) {
    if (this.isDownloading) return;
    
    this.isDownloading = true;
    
    for (let i = 0; i < items.length; i++) {
      this.downloadSingle(items[i].url, items[i].filename);
      
      // 最後のアイテム以外は待機
      if (i < items.length - 1) {
        await this.sleep(this.downloadDelay);
      }
    }
    
    this.isDownloading = false;
  }
  
  /**
   * download属性のサポートチェック
   * @returns {boolean}
   */
  supportsDownloadAttribute() {
    const a = document.createElement('a');
    return typeof a.download !== 'undefined';
  }
  
  /**
   * 遅延処理
   * @param {number} ms - ミリ秒
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

#### イベントハンドラー

```javascript
// DOMContentLoaded時の初期化
document.addEventListener('DOMContentLoaded', () => {
  const downloadManager = new DownloadManager();
  
  // QRデータ
  const qrData = [
    { url: 'https://walletcoin.edgeone.app/BTC.jpg', filename: 'BTC.jpg' },
    { url: 'https://walletcoin.edgeone.app/Bitcoincash_BCH.jpg', filename: 'Bitcoincash_BCH.jpg' },
    { url: 'https://walletcoin.edgeone.app/Ethereum_ETH.jpg', filename: 'Ethereum_ETH.jpg' },
    { url: 'https://walletcoin.edgeone.app/Ripple_XRP.jpg', filename: 'Ripple_XRP.jpg' }
  ];
  
  // QRリストの生成
  renderQRList(qrData);
  
  // 個別保存ボタンのイベント
  document.querySelectorAll('.btn-save').forEach((btn, index) => {
    btn.addEventListener('click', () => {
      downloadManager.downloadSingle(qrData[index].url, qrData[index].filename);
    });
  });
  
  // まとめて保存ボタンのイベント
  document.getElementById('saveAllBtn').addEventListener('click', () => {
    downloadManager.downloadAll(qrData);
  });
});

/**
 * QRリストをDOMに描画
 * @param {Array} data - QRデータ配列
 */
function renderQRList(data) {
  const container = document.getElementById('qrList');
  
  data.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'qr-item';
    
    row.innerHTML = `
      <div class="icon-frame"></div>
      <a href="${item.url}" target="_blank" rel="noopener" class="url-link">${item.url}</a>
      <button class="btn-save" data-index="${index}">保存</button>
    `;
    
    container.appendChild(row);
  });
}
```

## データモデル

### QRItemデータ構造

```javascript
{
  url: string,      // 画像の絶対URLまたは相対パス
  filename: string  // ダウンロード時のファイル名
}
```

### 設定データ

```javascript
const CONFIG = {
  downloadDelay: 300,        // ダウンロード間隔（ms）
  minButtonHeight: 44,       // 最小ボタン高さ（px）
  minRowHeight: 56,          // 最小行高さ（px）
  cardMaxWidth: 720,         // カード最大幅（px）
  mobileBreakpoint: 430,     // スマホブレークポイント（px）
  tabletBreakpoint: 768,     // タブレットブレークポイント（px）
  desktopBreakpoint: 1024    // デスクトップブレークポイント（px）
};
```


## 正確性プロパティ

プロパティとは、システムのすべての有効な実行において真であるべき特性または動作です。本質的には、システムが何をすべきかについての形式的な記述です。プロパティは、人間が読める仕様と機械で検証可能な正確性保証との橋渡しとなります。

### プロパティ1: URL形式の検証

*任意の* URL配列に対して、すべてのURLは絶対URL（https://で始まる）または相対パス（./で始まる）の形式である必要がある

**検証: 要件 1.3**

### プロパティ2: QRリスト行の構造完全性

*任意の* QRアイテム配列に対して、レンダリングされた各行はアイコン枠、URL表示、保存ボタンの3つの要素を含む必要がある

**検証: 要件 2.4**

### プロパティ3: URL表示のテキストオーバーフロー処理

*任意の* 画面サイズに対して、URL表示要素はtext-overflow: ellipsis、overflow: hidden、white-space: nowrapのスタイルを持つ必要がある

**検証: 要件 3.4**

### プロパティ4: 保存ボタンの最小高さ保証

*任意の* 画面サイズに対して、すべての保存ボタンの計算された高さは44px以上である必要がある

**検証: 要件 3.5**

### プロパティ5: リスト行の最小高さ保証

*任意の* 画面サイズに対して、すべてのQRリスト行の計算された高さは56px以上である必要がある

**検証: 要件 3.6**

### プロパティ6: 外部リンクのセキュリティ属性

*任意の* URLリンク要素に対して、target="_blank"とrel="noopener"の両方の属性が設定されている必要がある

**検証: 要件 4.2, 4.3**

### プロパティ7: 個別ダウンロードのトリガー

*任意の* 有効な画像URLに対して、対応する保存ボタンをクリックすると、DownloadManagerのdownloadSingleメソッドが正しいURLとファイル名で呼び出される必要がある

**検証: 要件 5.1**

### プロパティ8: 無効URLでのボタン無効化

*任意の* 空または無効なURLを持つQRアイテムに対して、対応する保存ボタンはdisabled属性を持つか、非表示である必要がある

**検証: 要件 5.5, 9.3**

### プロパティ9: 一括ダウンロードの完全性

*任意の* QRアイテム配列に対して、「まとめて保存」ボタンをクリックすると、すべてのアイテムのdownloadSingleメソッドが呼び出される必要がある

**検証: 要件 6.1**

### プロパティ10: ダウンロード間隔の遵守

*任意の* 2つ以上のアイテムを持つ配列に対して、連続するダウンロード呼び出しの間隔は250ms以上400ms以下である必要がある

**検証: 要件 6.2**

### プロパティ11: ダウンロード順序の保持

*任意の* QRアイテム配列に対して、一括ダウンロード時のdownloadSingle呼び出し順序は、配列の元の順序と一致する必要がある

**検証: 要件 6.3**

### プロパティ12: 一括ダウンロードの並行実行防止

*任意の* 一括ダウンロード実行中に、「まとめて保存」ボタンを再度クリックしても、新しいダウンロードプロセスは開始されない必要がある

**検証: 要件 6.4**

### プロパティ13: キーボードアクセシビリティ

*任意の* ボタンおよびリンク要素に対して、キーボードでフォーカス可能（tabindex >= 0またはネイティブフォーカス可能要素）である必要がある

**検証: 要件 9.1**

## エラーハンドリング

### 1. 無効なURL

**シナリオ**: QRデータに空または無効なURLが含まれる

**処理**:
- 対応する保存ボタンを無効化（disabled属性を追加）
- ユーザーがクリックできないようにする
- コンソールに警告を出力（開発時のデバッグ用）

```javascript
function validateURL(url) {
  if (!url || url.trim() === '') {
    return false;
  }
  
  // 絶対URLまたは相対パスのチェック
  return url.startsWith('https://') || url.startsWith('./');
}
```

### 2. download属性非対応ブラウザ

**シナリオ**: iOS Safariなど、download属性をサポートしないブラウザ

**処理**:
- 機能検出を実行
- フォールバックとして新しいタブで画像を開く
- ユーザーは長押しで手動保存可能

```javascript
supportsDownloadAttribute() {
  const a = document.createElement('a');
  return typeof a.download !== 'undefined';
}
```

### 3. ダウンロード失敗

**シナリオ**: ネットワークエラーや画像が存在しない

**処理**:
- ブラウザのデフォルトエラーハンドリングに委ねる
- 一括ダウンロード時は、エラーが発生しても次のアイテムに進む
- コンソールにエラーログを出力

### 4. 一括ダウンロード中断

**シナリオ**: ユーザーがページを離れる、またはブラウザがダウンロードをブロック

**処理**:
- isDownloadingフラグをリセット
- 次回のクリックで再実行可能にする
- 部分的にダウンロードされたファイルはブラウザの履歴に残る

## テスト戦略

### デュアルテストアプローチ

本プロジェクトでは、ユニットテストとプロパティベーステストの両方を使用します：

- **ユニットテスト**: 特定の例、エッジケース、エラー条件を検証
- **プロパティテスト**: すべての入力にわたる普遍的なプロパティを検証

両者は補完的であり、包括的なカバレッジに必要です。ユニットテストは具体的なバグを捕捉し、プロパティテストは一般的な正確性を検証します。

### テストフレームワーク

- **ユニットテスト**: Jest + jsdom（DOM操作のテスト用）
- **プロパティベーステスト**: fast-check（JavaScriptのプロパティベーステストライブラリ）

### プロパティテスト設定

各プロパティテストは以下の設定で実行します：

- **反復回数**: 最低100回（ランダム化による）
- **タグ形式**: `Feature: qr-image-saver, Property {番号}: {プロパティテキスト}`
- **各正確性プロパティは単一のプロパティベーステストで実装**

### テストカバレッジ

#### ユニットテスト対象

1. **特定の例**:
   - ヘッダーに「Hardware Wallet QR」テキストが表示される（要件 2.3）
   - フッターに「まとめて保存」ボタンが表示される（要件 2.5）
   - 会社情報テキストが表示される（要件 2.6）
   - スマートフォン幅（375px）でカードが正しい幅を持つ（要件 3.1）
   - デスクトップ幅（1200px）でカードが最大幅を持つ（要件 3.3）

2. **エッジケース**:
   - 空のQRデータ配列
   - 単一アイテムのQRデータ
   - 非常に長いURL（省略表示の確認）
   - download属性非対応環境でのフォールバック（要件 5.4）

3. **エラー条件**:
   - 無効なURL形式
   - 空のURL
   - ダウンロード中の重複クリック

4. **統合ポイント**:
   - DOMContentLoadedイベントでの初期化
   - イベントリスナーの正しいバインディング
   - HTMLマークアップとJavaScript配列の両方のデータソース（要件 7.1）
   - URL表示とカスタムラベル表示の両方（要件 7.2）

#### プロパティテスト対象

すべての正確性プロパティ（プロパティ1-13）をプロパティベーステストで実装します。各テストは以下の形式に従います：

```javascript
// 例: プロパティ1のテスト
test('Feature: qr-image-saver, Property 1: URL形式の検証', () => {
  fc.assert(
    fc.property(
      fc.array(fc.oneof(
        fc.webUrl({ validSchemes: ['https'] }),
        fc.string().map(s => `./${s}.jpg`)
      )),
      (urls) => {
        // すべてのURLが正しい形式かチェック
        return urls.every(url => 
          url.startsWith('https://') || url.startsWith('./')
        );
      }
    ),
    { numRuns: 100 }
  );
});
```

### テスト実行

```bash
# すべてのテストを実行
npm test

# プロパティテストのみ実行
npm test -- --testNamePattern="Property"

# カバレッジレポート生成
npm test -- --coverage
```

### 継続的インテグレーション

- すべてのプルリクエストでテストを自動実行
- カバレッジ閾値: 80%以上
- プロパティテストの失敗時は、失敗した入力例を記録
