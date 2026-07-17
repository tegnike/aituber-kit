// Generated from /Users/user/Downloads/スライドテンプレート拡張ガイド.zip.
// Keep the template IDs synchronized with nikechan-morning-show/apps/console/src/slide-template-library.css.
export const newsTemplateCss = String.raw`
div.marpit > svg > foreignObject > section.news-agenda {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-agenda h1 {
  margin:0 0 32px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-agenda ul {
  list-style:none;
  margin:0;
  padding:0;
  display:grid;
  gap:14px;
}

div.marpit > svg > foreignObject > section.news-agenda li {
  display:grid;
  grid-template-columns:auto 1fr;
  align-items:center;
  gap:18px;
  padding:14px 22px;
  background:#f6f4ef;
  font-size:28px;
  line-height:1.4;
}

div.marpit > svg > foreignObject > section.news-agenda li strong {
  color:#b45309;
  font-size:32px;
}

div.marpit > svg > foreignObject > section.news-summary {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-summary h1 {
  margin:0 0 36px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-summary h2 {
  margin:0 0 24px;
  padding:6px 0 6px 20px;
  border-left:6px solid #b45309;
  font-size:34px;
  line-height:1.4;
}

div.marpit > svg > foreignObject > section.news-summary h2:last-of-type {
  margin-bottom:0;
}

div.marpit > svg > foreignObject > section.news-quote {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
  justify-items:center;
  text-align:center;
}

div.marpit > svg > foreignObject > section.news-quote blockquote {
  margin:0;
  padding:0;
  border:0;
  max-width:82%;
  font-size:42px;
  font-weight:700;
  line-height:1.5;
}

div.marpit > svg > foreignObject > section.news-quote blockquote::before {
  content:"\201C";
  color:#b45309;
}

div.marpit > svg > foreignObject > section.news-quote blockquote::after {
  content:"\201D";
  color:#b45309;
}

div.marpit > svg > foreignObject > section.news-quote p {
  margin:28px 0 0;
  color:#6b6555;
  font-size:24px;
}

div.marpit > svg > foreignObject > section.news-qa {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
  justify-items:center;
  text-align:center;
}

div.marpit > svg > foreignObject > section.news-qa h1 {
  margin:0 0 32px;
  font-size:52px;
  line-height:1.4;
}

div.marpit > svg > foreignObject > section.news-qa h1::after {
  content:"";
  display:block;
  width:80px;
  height:5px;
  margin:24px auto 0;
  background:#b45309;
}

div.marpit > svg > foreignObject > section.news-qa p {
  margin:0;
  max-width:85%;
  font-size:30px;
  line-height:1.6;
}

div.marpit > svg > foreignObject > section.news-definition {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-definition h1 {
  margin:0 0 30px;
  padding-bottom:12px;
  border-bottom:4px solid #b45309;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-definition p {
  margin:0;
  font-size:28px;
  line-height:1.7;
}

div.marpit > svg > foreignObject > section.news-definition ul {
  margin:24px 0 0;
  padding-left:1.2em;
  display:grid;
  gap:10px;
  font-size:24px;
}

div.marpit > svg > foreignObject > section.news-definition li::marker {
  color:#b45309;
}

div.marpit > svg > foreignObject > section.news-stat {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
  justify-items:center;
  text-align:center;
}

div.marpit > svg > foreignObject > section.news-stat h1 {
  margin:0 0 8px;
  font-size:36px;
  font-weight:600;
}

div.marpit > svg > foreignObject > section.news-stat p {
  margin:0;
  color:#6b6555;
  font-size:24px;
}

div.marpit > svg > foreignObject > section.news-stat p strong {
  display:block;
  margin:0 0 12px;
  font-size:128px;
  line-height:1.05;
  letter-spacing:-0.02em;
  color:#b45309;
}

div.marpit > svg > foreignObject > section.news-ranking {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-ranking h1 {
  margin:0 0 30px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-ranking ul {
  list-style:none;
  margin:0;
  padding:0;
  display:grid;
  gap:12px;
}

div.marpit > svg > foreignObject > section.news-ranking li {
  display:grid;
  grid-template-columns:auto 1fr;
  align-items:center;
  gap:20px;
  padding:10px 0;
  border-bottom:1px solid #d8d4ca;
  font-size:28px;
}

div.marpit > svg > foreignObject > section.news-ranking li strong {
  display:grid;
  place-items:center;
  width:52px;
  height:52px;
  min-width:44px;
  min-height:44px;
  border-radius:50%;
  background:#1a2233;
  color:#ffffff;
  font-size:26px;
}

div.marpit > svg > foreignObject > section.news-ranking li:first-child strong {
  background:#b45309;
}

div.marpit > svg > foreignObject > section.news-checklist {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-checklist h1 {
  margin:0 0 30px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-checklist ul {
  list-style:none;
  margin:0;
  padding:0;
  display:grid;
  gap:16px;
}

div.marpit > svg > foreignObject > section.news-checklist li {
  position:relative;
  padding-left:44px;
  font-size:28px;
  line-height:1.5;
}

div.marpit > svg > foreignObject > section.news-checklist li::before {
  content:"\2713";
  position:absolute;
  left:0;
  top:0;
  color:#b45309;
  font-weight:700;
  font-size:30px;
}

div.marpit > svg > foreignObject > section.news-cause {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-cause h1 {
  margin:0 0 32px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-cause h2 {
  margin:0;
  padding:18px 26px;
  background:#f6f4ef;
  border-left:6px solid #1a2233;
  font-size:30px;
}

div.marpit > svg > foreignObject > section.news-cause p {
  margin:10px 0 0;
  padding-left:32px;
  font-size:24px;
  line-height:1.5;
}

div.marpit > svg > foreignObject > section.news-cause h2 ~ h2 {
  position:relative;
  margin-top:52px;
  border-left-color:#b45309;
}

div.marpit > svg > foreignObject > section.news-cause h2 ~ h2::before {
  content:"\2193";
  position:absolute;
  top:-48px;
  left:24px;
  color:#b45309;
  font-weight:700;
  font-size:36px;
}

div.marpit > svg > foreignObject > section.news-schedule {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-schedule h1 {
  margin:0 0 28px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-schedule table {
  width:100%;
  border-collapse:collapse;
  font-size:26px;
}

div.marpit > svg > foreignObject > section.news-schedule th {
  padding:14px 20px;
  background:#1a2233;
  color:#ffffff;
  text-align:left;
  font-weight:600;
}

div.marpit > svg > foreignObject > section.news-schedule td {
  padding:14px 20px;
  border-bottom:1px solid #d8d4ca;
  line-height:1.4;
}

div.marpit > svg > foreignObject > section.news-glossary {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-glossary h1 {
  margin:0 0 28px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-glossary table {
  width:100%;
  border-collapse:collapse;
  font-size:26px;
}

div.marpit > svg > foreignObject > section.news-glossary th {
  padding:12px 20px;
  background:#f6f4ef;
  text-align:left;
  font-weight:600;
  border-bottom:2px solid #1a2233;
}

div.marpit > svg > foreignObject > section.news-glossary td {
  padding:14px 20px;
  border-bottom:1px solid #d8d4ca;
  line-height:1.5;
}

div.marpit > svg > foreignObject > section.news-glossary td:first-child {
  font-weight:700;
  color:#b45309;
  white-space:nowrap;
}

div.marpit > svg > foreignObject > section.news-warning {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-warning h1 {
  margin:0 0 28px;
  color:#b42318;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-warning blockquote {
  margin:0 0 28px;
  padding:20px 28px;
  border:3px solid #b42318;
  font-size:32px;
  font-weight:700;
  line-height:1.5;
}

div.marpit > svg > foreignObject > section.news-warning ul {
  margin:0;
  padding-left:1.2em;
  display:grid;
  gap:12px;
  font-size:26px;
}

div.marpit > svg > foreignObject > section.news-warning li::marker {
  color:#b42318;
}

div.marpit > svg > foreignObject > section.news-actions {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-actions h1 {
  margin:0 0 32px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-actions ul {
  list-style:none;
  margin:0;
  padding:0;
  display:grid;
  grid-template-columns:repeat(auto-fit, minmax(0, 1fr));
  gap:22px;
}

div.marpit > svg > foreignObject > section.news-actions li {
  display:grid;
  gap:12px;
  align-content:start;
  padding:26px 24px;
  background:#f6f4ef;
  font-size:24px;
  line-height:1.5;
}

div.marpit > svg > foreignObject > section.news-actions li strong {
  color:#b45309;
  font-size:30px;
}

div.marpit > svg > foreignObject > section.news-faq {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-faq h1 {
  margin:0 0 30px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-faq h2 {
  position:relative;
  margin:30px 0 10px;
  padding-left:44px;
  font-size:30px;
}

div.marpit > svg > foreignObject > section.news-faq h2::before {
  content:"Q.";
  position:absolute;
  left:0;
  top:0;
  color:#b45309;
  font-weight:700;
}

div.marpit > svg > foreignObject > section.news-faq h2:first-of-type {
  margin-top:0;
}

div.marpit > svg > foreignObject > section.news-faq p {
  margin:0;
  padding-left:44px;
  font-size:24px;
  line-height:1.6;
}

div.marpit > svg > foreignObject > section.news-recap {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-recap h1 {
  margin:0 0 28px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-recap ul {
  margin:0;
  padding-left:1.2em;
  display:grid;
  gap:14px;
  font-size:28px;
  line-height:1.5;
}

div.marpit > svg > foreignObject > section.news-recap li::marker {
  color:#b45309;
}

div.marpit > svg > foreignObject > section.news-recap ul + p {
  margin:32px 0 0;
  padding:18px 26px;
  background:#1a2233;
  color:#ffffff;
  font-weight:700;
  font-size:28px;
}

div.marpit > svg > foreignObject > section.news-photo-main {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  grid-template-columns:1.05fr 1fr;
  column-gap:56px;
  align-content:center;
  align-items:center;
}

div.marpit > svg > foreignObject > section.news-photo-main h1 {
  grid-column:1;
  margin:0 0 20px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-photo-main p {
  grid-column:1;
  margin:0 0 14px;
  font-size:26px;
  line-height:1.6;
}

div.marpit > svg > foreignObject > section.news-photo-main > p:has(> img:only-child) {
  grid-column:2;
  grid-row:1 / span 8;
  align-items:center;
  align-self:stretch;
  display:flex;
  justify-content:center;
  margin:0;
}

div.marpit > svg > foreignObject > section.news-photo-main > p:has(> img:only-child) img {
  align-self:center;
  max-width:100%;
  max-height:540px;
  object-fit:contain;
}

div.marpit > svg > foreignObject > section.news-photo-full {
  box-sizing:border-box;
  height:100%;
  position:relative;
  display:grid;
  align-content:end;
  overflow:hidden;
  padding:0;
}

div.marpit > svg > foreignObject > section.news-photo-full img {
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  object-fit:cover;
}

div.marpit > svg > foreignObject > section.news-photo-full h1 {
  position:relative;
  margin:0;
  padding:24px 44px 4px;
  background:rgba(15,20,30,0.82);
  color:#ffffff;
  font-size:44px;
}

div.marpit > svg > foreignObject > section.news-photo-full p {
  position:relative;
  margin:0;
  padding:8px 44px 28px;
  background:rgba(15,20,30,0.82);
  color:#ddd8cd;
  font-size:22px;
}

div.marpit > svg > foreignObject > section.news-photo-pair {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  grid-template-columns:1fr 1fr;
  grid-template-rows:auto minmax(0, 1fr) auto;
  gap:16px 40px;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-photo-pair h1 {
  grid-column:1 / -1;
  margin:0 0 8px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-photo-pair img {
  width:100%;
  height:100%;
  min-height:0;
  object-fit:contain;
  background:#f6f4ef;
}

div.marpit > svg > foreignObject > section.news-photo-pair img:nth-of-type(1) {
  grid-area:2 / 1;
}

div.marpit > svg > foreignObject > section.news-photo-pair img:nth-of-type(2) {
  grid-area:2 / 2;
}

div.marpit > svg > foreignObject > section.news-photo-pair h2 {
  margin:0;
  text-align:center;
  font-size:28px;
}

div.marpit > svg > foreignObject > section.news-photo-pair h2:nth-of-type(1) {
  grid-area:3 / 1;
}

div.marpit > svg > foreignObject > section.news-photo-pair h2:nth-of-type(2) {
  grid-area:3 / 2;
}

div.marpit > svg > foreignObject > section.news-photo-top {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  grid-template-rows:300px auto minmax(0, 1fr);
  row-gap:24px;
}

div.marpit > svg > foreignObject > section.news-photo-top img {
  width:100%;
  height:100%;
  object-fit:cover;
}

div.marpit > svg > foreignObject > section.news-photo-top h1 {
  margin:0;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-photo-top p {
  margin:0;
  font-size:26px;
  line-height:1.6;
}

div.marpit > svg > foreignObject > section.news-photo-point {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  grid-template-columns:360px 1fr;
  column-gap:48px;
  align-content:center;
  align-items:center;
}

div.marpit > svg > foreignObject > section.news-photo-point img {
  grid-column:1;
  grid-row:1 / span 8;
  align-self:center;
  max-width:100%;
  max-height:480px;
  object-fit:contain;
}

div.marpit > svg > foreignObject > section.news-photo-point h1 {
  grid-column:2;
  margin:0 0 24px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-photo-point ul {
  grid-column:2;
  margin:0;
  padding-left:1.2em;
  display:grid;
  gap:14px;
  font-size:28px;
  line-height:1.5;
}

div.marpit > svg > foreignObject > section.news-photo-point li::marker {
  color:#b45309;
}

div.marpit > svg > foreignObject > section.news-section {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
  justify-items:start;
  background:#1a2233;
  color:#ffffff;
}

div.marpit > svg > foreignObject > section.news-section p {
  margin:0 0 18px;
  color:#e8a765;
  font-weight:600;
  letter-spacing:0.15em;
  font-size:24px;
}

div.marpit > svg > foreignObject > section.news-section h1 {
  margin:0;
  font-size:76px;
  line-height:1.3;
}

div.marpit > svg > foreignObject > section.news-section h1::after {
  content:"";
  display:block;
  width:120px;
  height:6px;
  background:#b45309;
  margin-top:32px;
}

div.marpit > svg > foreignObject > section.news-headline {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-headline h1 {
  margin:0 0 18px;
  font-size:64px;
  line-height:1.25;
  font-weight:900;
}

div.marpit > svg > foreignObject > section.news-headline p:first-of-type {
  margin:0 0 22px;
  padding:14px 2px;
  border-top:2px solid #1a2233;
  border-bottom:2px solid #1a2233;
  font-size:28px;
  font-weight:700;
  line-height:1.5;
}

div.marpit > svg > foreignObject > section.news-headline p ~ p {
  margin:0;
  column-count:2;
  column-gap:40px;
  font-size:22px;
  line-height:1.7;
  text-align:justify;
}

div.marpit > svg > foreignObject > section.news-matrix {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-matrix h1 {
  margin:0 0 26px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-matrix ul {
  list-style:none;
  margin:0;
  padding:0;
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:14px;
}

div.marpit > svg > foreignObject > section.news-matrix li {
  display:grid;
  gap:8px;
  align-content:start;
  padding:22px 24px;
  background:#f6f4ef;
  border-top:4px solid #1a2233;
  font-size:22px;
  line-height:1.55;
}

div.marpit > svg > foreignObject > section.news-matrix li strong {
  font-size:27px;
}

div.marpit > svg > foreignObject > section.news-matrix li:nth-child(1) {
  border-top-color:#b45309;
}

div.marpit > svg > foreignObject > section.news-matrix li:nth-child(1) strong {
  color:#b45309;
}

div.marpit > svg > foreignObject > section.news-flow {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-flow h1 {
  margin:0 0 32px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-flow ul {
  list-style:none;
  margin:0;
  padding:0;
  display:grid;
  grid-auto-flow:column;
  grid-auto-columns:1fr;
  gap:18px;
}

div.marpit > svg > foreignObject > section.news-flow li {
  display:grid;
  gap:10px;
  align-content:start;
  padding:26px 40px;
  background:#f6f4ef;
  clip-path:polygon(0 0, calc(100% - 24px) 0, 100% 50%, calc(100% - 24px) 100%, 0 100%, 24px 50%);
  font-size:21px;
  line-height:1.5;
}

div.marpit > svg > foreignObject > section.news-flow li strong {
  color:#b45309;
  font-size:26px;
}

div.marpit > svg > foreignObject > section.news-flow li:last-child {
  background:#1a2233;
  color:#ffffff;
}

div.marpit > svg > foreignObject > section.news-flow li:last-child strong {
  color:#e8a765;
}

div.marpit > svg > foreignObject > section.news-versus {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  grid-template-columns:1fr 1fr;
  grid-template-rows:auto auto 1fr;
  column-gap:44px;
  row-gap:18px;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-versus h1 {
  grid-column:1 / -1;
  margin:0 0 10px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-versus h2 {
  margin:0;
  padding:14px 20px;
  text-align:center;
  font-size:30px;
}

div.marpit > svg > foreignObject > section.news-versus h2:nth-of-type(1) {
  grid-area:2 / 1;
  background:#1a2233;
  color:#ffffff;
}

div.marpit > svg > foreignObject > section.news-versus h2:nth-of-type(2) {
  grid-area:2 / 2;
  background:#b45309;
  color:#ffffff;
}

div.marpit > svg > foreignObject > section.news-versus ul {
  margin:0;
  padding-left:1.1em;
  display:grid;
  gap:12px;
  align-content:start;
  font-size:24px;
  line-height:1.55;
}

div.marpit > svg > foreignObject > section.news-versus ul:nth-of-type(1) {
  grid-area:3 / 1;
}

div.marpit > svg > foreignObject > section.news-versus ul:nth-of-type(2) {
  grid-area:3 / 2;
}

div.marpit > svg > foreignObject > section.news-pyramid {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-pyramid h1 {
  margin:0 0 32px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-pyramid ul {
  list-style:none;
  margin:0;
  padding:0;
  display:grid;
  gap:10px;
  justify-items:center;
}

div.marpit > svg > foreignObject > section.news-pyramid li {
  box-sizing:border-box;
  display:grid;
  grid-template-columns:auto 1fr;
  align-items:center;
  gap:16px;
  padding:16px 28px;
  color:#ffffff;
  font-size:24px;
}

div.marpit > svg > foreignObject > section.news-pyramid li strong {
  font-size:26px;
}

div.marpit > svg > foreignObject > section.news-pyramid li:nth-child(1) {
  width:40%;
  background:#b45309;
}

div.marpit > svg > foreignObject > section.news-pyramid li:nth-child(2) {
  width:65%;
  background:#3c4a63;
}

div.marpit > svg > foreignObject > section.news-pyramid li:nth-child(3) {
  width:90%;
  background:#1a2233;
}

div.marpit > svg > foreignObject > section.news-bignums {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-bignums h1 {
  margin:0 0 32px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-bignums ul {
  list-style:none;
  margin:0;
  padding:0;
  display:grid;
  grid-auto-flow:column;
  grid-auto-columns:1fr;
  gap:36px;
}

div.marpit > svg > foreignObject > section.news-bignums li {
  display:grid;
  gap:10px;
  align-content:center;
  text-align:center;
  padding:30px 16px;
  background:#f6f4ef;
  border-top:5px solid #b45309;
  color:#6b6555;
  font-size:22px;
  line-height:1.5;
}

div.marpit > svg > foreignObject > section.news-bignums li strong {
  font-size:66px;
  line-height:1.1;
  color:#1a2233;
}

div.marpit > svg > foreignObject > section.news-spec {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-spec h1 {
  margin:0 0 24px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-spec table {
  width:100%;
  border-collapse:collapse;
  font-size:24px;
}

div.marpit > svg > foreignObject > section.news-spec th {
  padding:8px 18px;
  text-align:left;
  font-weight:600;
  color:#6b6555;
  border-bottom:2px solid #1a2233;
  font-size:18px;
}

div.marpit > svg > foreignObject > section.news-spec td {
  padding:12px 18px;
  border-bottom:1px solid #d8d4ca;
  line-height:1.5;
}

div.marpit > svg > foreignObject > section.news-spec td:first-child {
  width:28%;
  font-weight:700;
  background:#f6f4ef;
}

div.marpit > svg > foreignObject > section.news-quote-pair {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  grid-template-columns:1fr 1fr;
  grid-template-rows:auto 1fr auto;
  column-gap:44px;
  row-gap:8px;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-quote-pair h1 {
  grid-column:1 / -1;
  margin:0 0 24px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-quote-pair blockquote {
  margin:0;
  padding:26px 28px;
  background:#f6f4ef;
  border-top:4px solid #b45309;
  font-size:28px;
  font-weight:700;
  line-height:1.6;
}

div.marpit > svg > foreignObject > section.news-quote-pair blockquote:nth-of-type(1) {
  grid-area:2 / 1;
}

div.marpit > svg > foreignObject > section.news-quote-pair blockquote:nth-of-type(2) {
  grid-area:2 / 2;
  border-top-color:#1a2233;
}

div.marpit > svg > foreignObject > section.news-quote-pair p {
  margin:0;
  padding:0 28px;
  color:#6b6555;
  font-size:21px;
}

div.marpit > svg > foreignObject > section.news-quote-pair p:nth-of-type(1) {
  grid-area:3 / 1;
}

div.marpit > svg > foreignObject > section.news-quote-pair p:nth-of-type(2) {
  grid-area:3 / 2;
}

div.marpit > svg > foreignObject > section.news-before-after {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  grid-template-columns:1fr auto 1fr;
  grid-template-rows:auto 1fr auto auto 1fr;
  column-gap:32px;
  row-gap:14px;
}

div.marpit > svg > foreignObject > section.news-before-after h1 {
  grid-column:1 / -1;
  margin:0 0 10px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-before-after h2 {
  margin:0;
  padding:12px 20px;
  text-align:center;
  font-size:28px;
}

div.marpit > svg > foreignObject > section.news-before-after h2:nth-of-type(1) {
  grid-area:3 / 1;
  background:#f6f4ef;
}

div.marpit > svg > foreignObject > section.news-before-after h2:nth-of-type(2) {
  grid-area:3 / 3;
  background:#b45309;
  color:#ffffff;
}

div.marpit > svg > foreignObject > section.news-before-after ul {
  margin:0;
  padding-left:1.1em;
  display:grid;
  gap:12px;
  align-content:start;
  font-size:28px;
  line-height:1.55;
}

div.marpit > svg > foreignObject > section.news-before-after ul:nth-of-type(1) {
  grid-area:4 / 1;
}

div.marpit > svg > foreignObject > section.news-before-after ul:nth-of-type(2) {
  grid-area:4 / 3;
}

div.marpit > svg > foreignObject > section.news-before-after::after {
  content:"\2192";
  grid-area:3 / 2 / 5 / 3;
  align-self:center;
  color:#b45309;
  font-weight:700;
  font-size:52px;
}

div.marpit > svg > foreignObject > section.news-three-points {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  grid-template-rows:auto 1fr;
  row-gap:28px;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-three-points h1 {
  margin:0;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-three-points ul {
  list-style:none;
  margin:0;
  padding:0;
  display:grid;
  grid-auto-flow:column;
  grid-auto-columns:1fr;
  gap:24px;
  align-self:center;
}

div.marpit > svg > foreignObject > section.news-three-points li {
  display:grid;
  gap:14px;
  align-content:start;
  min-height:180px;
  padding:28px 20px;
  border-top:5px solid #b45309;
  border-radius:16px;
  background:rgba(255,255,255,0.58);
  box-shadow:0 14px 32px rgba(26,34,51,0.08);
  font-size:26px;
  line-height:1.55;
}

div.marpit > svg > foreignObject > section.news-three-points li:first-child {
  padding-left:20px;
}

div.marpit > svg > foreignObject > section.news-three-points li strong {
  padding-bottom:10px;
  border-bottom:2px solid rgba(180,83,9,0.32);
  color:#b45309;
  font-size:29px;
}

div.marpit > svg > foreignObject > section.news-keyword {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
  justify-items:center;
  text-align:center;
}

div.marpit > svg > foreignObject > section.news-keyword h1 {
  margin:0 0 20px;
  font-size:86px;
  letter-spacing:0.04em;
}

div.marpit > svg > foreignObject > section.news-keyword p {
  margin:0;
  max-width:80%;
  font-size:26px;
  line-height:1.7;
}

div.marpit > svg > foreignObject > section.news-keyword ul {
  list-style:none;
  margin:30px 0 0;
  padding:0;
  display:flex;
  flex-wrap:wrap;
  justify-content:center;
  gap:14px;
}

div.marpit > svg > foreignObject > section.news-keyword li {
  padding:10px 22px;
  border:2px solid #1a2233;
  border-radius:999px;
  font-weight:600;
  font-size:21px;
}

div.marpit > svg > foreignObject > section.news-question-list {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
  counter-reset:q;
}

div.marpit > svg > foreignObject > section.news-question-list h1 {
  margin:0 0 30px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-question-list h2 {
  counter-increment:q;
  display:grid;
  grid-template-columns:auto 1fr;
  align-items:baseline;
  gap:22px;
  margin:26px 0 8px;
  font-size:30px;
}

div.marpit > svg > foreignObject > section.news-question-list h2::before {
  content:counter(q, decimal-leading-zero);
  color:#b45309;
  font-weight:900;
  font-size:40px;
}

div.marpit > svg > foreignObject > section.news-question-list h2:first-of-type {
  margin-top:0;
}

div.marpit > svg > foreignObject > section.news-question-list p {
  margin:0;
  padding-left:62px;
  color:#6b6555;
  font-size:21px;
  line-height:1.6;
}

div.marpit > svg > foreignObject > section.news-dark-summary {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
  background:#1a2233;
  color:#ffffff;
}

div.marpit > svg > foreignObject > section.news-dark-summary h1 {
  margin:0;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-dark-summary h1::after {
  content:"";
  display:block;
  width:90px;
  height:5px;
  background:#b45309;
  margin:20px 0 0;
}

div.marpit > svg > foreignObject > section.news-dark-summary ul {
  list-style:none;
  margin:34px 0 0;
  padding:0;
  display:grid;
  gap:18px;
}

div.marpit > svg > foreignObject > section.news-dark-summary li {
  display:grid;
  grid-template-columns:auto 1fr;
  gap:16px;
  font-size:28px;
  line-height:1.6;
}

div.marpit > svg > foreignObject > section.news-dark-summary li::before {
  content:"\2014";
  color:#e8a765;
  font-weight:700;
}

div.marpit > svg > foreignObject > section.news-dark-summary li strong {
  color:#e8a765;
}

div.marpit > svg > foreignObject > section.news-sources {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-sources h1 {
  margin:0 0 24px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-sources ul {
  list-style:none;
  margin:0;
  padding:0;
  display:grid;
}

div.marpit > svg > foreignObject > section.news-sources li {
  display:grid;
  grid-template-columns:180px 1fr;
  align-items:start;
  gap:24px;
  padding:18px 0;
  border-bottom:1px solid #d8d4ca;
  font-size:25px;
  line-height:1.55;
}

div.marpit > svg > foreignObject > section.news-sources li strong {
  justify-self:start;
  padding:6px 14px;
  background:#1a2233;
  color:#ffffff;
  font-size:21px;
}

div.marpit > svg > foreignObject > section.news-photo-hero {
  box-sizing:border-box;
  height:100%;
  display:grid;
  grid-template-columns:1.2fr 1fr;
  grid-template-rows:1fr auto auto 1fr;
  background:#1a2233;
  padding:0;
  overflow:hidden;
}

div.marpit > svg > foreignObject > section.news-photo-hero img {
  grid-area:1 / 1 / 5 / 2;
  width:100%;
  height:100%;
  object-fit:cover;
}

div.marpit > svg > foreignObject > section.news-photo-hero h1 {
  grid-area:2 / 2;
  margin:0;
  padding:0 56px;
  color:#ffffff;
  font-size:46px;
  line-height:1.35;
}

div.marpit > svg > foreignObject > section.news-photo-hero p {
  grid-area:3 / 2;
  margin:0;
  padding:20px 56px 0;
  color:#cfd4de;
  font-size:24px;
  line-height:1.7;
}

div.marpit > svg > foreignObject > section.news-photo-triple {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  grid-template-columns:1fr 1fr 1fr;
  grid-template-rows:auto minmax(0, 1fr) auto;
  gap:14px 28px;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-photo-triple h1 {
  grid-column:1 / -1;
  margin:0 0 8px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-photo-triple img {
  width:100%;
  height:100%;
  min-height:0;
  object-fit:cover;
  background:#f6f4ef;
}

div.marpit > svg > foreignObject > section.news-photo-triple img:nth-of-type(1) {
  grid-area:2 / 1;
}

div.marpit > svg > foreignObject > section.news-photo-triple img:nth-of-type(2) {
  grid-area:2 / 2;
}

div.marpit > svg > foreignObject > section.news-photo-triple img:nth-of-type(3) {
  grid-area:2 / 3;
}

div.marpit > svg > foreignObject > section.news-photo-triple h2 {
  margin:0;
  text-align:center;
  font-size:25px;
}

div.marpit > svg > foreignObject > section.news-photo-triple h2:nth-of-type(1) {
  grid-area:3 / 1;
}

div.marpit > svg > foreignObject > section.news-photo-triple h2:nth-of-type(2) {
  grid-area:3 / 2;
}

div.marpit > svg > foreignObject > section.news-photo-triple h2:nth-of-type(3) {
  grid-area:3 / 3;
}

div.marpit > svg > foreignObject > section.news-photo-quote {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  grid-template-columns:260px 1fr;
  column-gap:52px;
  align-content:center;
  align-items:center;
}

div.marpit > svg > foreignObject > section.news-photo-quote img {
  grid-column:1;
  grid-row:1 / span 4;
  width:100%;
  aspect-ratio:1 / 1;
  border-radius:50%;
  object-fit:cover;
}

div.marpit > svg > foreignObject > section.news-photo-quote blockquote {
  grid-column:2;
  margin:0;
  padding:0;
  border:0;
  font-size:36px;
  font-weight:700;
  line-height:1.6;
}

div.marpit > svg > foreignObject > section.news-photo-quote blockquote::before {
  content:"\201C";
  color:#b45309;
}

div.marpit > svg > foreignObject > section.news-photo-quote blockquote::after {
  content:"\201D";
  color:#b45309;
}

div.marpit > svg > foreignObject > section.news-photo-quote p {
  grid-column:2;
  margin:18px 0 0;
  color:#6b6555;
  font-size:22px;
}

div.marpit > svg > foreignObject > section.news-photo-article {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:block;
}

div.marpit > svg > foreignObject > section.news-photo-article h1 {
  margin:0 0 24px;
  font-size:46px;
}

div.marpit > svg > foreignObject > section.news-photo-article img {
  float:right;
  width:300px;
  aspect-ratio:3 / 4;
  object-fit:cover;
  margin:6px 0 20px 36px;
}

div.marpit > svg > foreignObject > section.news-photo-article p {
  margin:0 0 18px;
  font-size:25px;
  line-height:1.8;
  text-align:justify;
}

div.marpit > svg > foreignObject > section.news-photo-data {
  box-sizing:border-box;
  height:100%;
  padding:48px 60px;
  display:grid;
  grid-template-columns:1fr 1fr;
  grid-template-rows:auto 1fr;
  gap:24px 48px;
}

div.marpit > svg > foreignObject > section.news-photo-data h1 {
  grid-area:1 / 1;
  margin:0;
  font-size:46px;
  align-self:end;
}

div.marpit > svg > foreignObject > section.news-photo-data img {
  grid-area:1 / 2 / 3 / 3;
  width:100%;
  height:100%;
  min-height:0;
  object-fit:cover;
}

div.marpit > svg > foreignObject > section.news-photo-data ul {
  grid-area:2 / 1;
  list-style:none;
  margin:0;
  padding:0;
  display:grid;
  gap:18px;
  align-content:center;
}

div.marpit > svg > foreignObject > section.news-photo-data li {
  display:grid;
  gap:4px;
  padding:20px 24px;
  background:#f6f4ef;
  border-left:5px solid #b45309;
  color:#6b6555;
  font-size:21px;
}

div.marpit > svg > foreignObject > section.news-photo-data li strong {
  font-size:50px;
  line-height:1.1;
  color:#1a2233;
}

/* Fit the complete cause/effect story inside the 16:9 frame. */
div.marpit > svg > foreignObject > section.news-cause h1 {
  margin-bottom:24px;
  font-size:44px;
}

div.marpit > svg > foreignObject > section.news-cause h2 {
  padding:14px 24px;
}

div.marpit > svg > foreignObject > section.news-cause p {
  margin-top:8px;
  line-height:1.35;
}

div.marpit > svg > foreignObject > section.news-cause h2 ~ h2 {
  margin-top:42px;
}

div.marpit > svg > foreignObject > section.news-cause h2 ~ h2::before {
  top:-40px;
}
`
