/* ---------- Market reading: AvBuyer (Morten, 2 Nov 2026) ----------
   A link to AvBuyer's free digital magazine with a sign-up note, on Training for everyone.
   Each person signs up free with their own Archē email. Issues and articles are never copied into the portal or
   shared as files: AvBuyer holds the copyright, so we share links only. */
(function(){
  const AVB_URL = "https://www.avbuyer.com/magazines/avbuyer";
  function panel(){
    return `<div class="panel stack" id="readingPanel" style="margin-bottom:16px"><h2>Market reading: AvBuyer</h2>
      <p class="small">AvBuyer's monthly magazine covers business aircraft for sale, market values and trends in the pre-owned market. The digital edition is free.</p>
      <ol class="small" style="margin:0;padding-left:20px"><li>Open AvBuyer and choose the <b>free digital edition</b>.</li><li>Sign up with your <b>Archē email address</b>, not a personal one.</li><li>Read each issue when it arrives: aircraft values and what is on the market help you advise clients.</li></ol>
      <p class="small muted">AvBuyer owns the magazine. Read it on AvBuyer. Do not download, copy or forward issues or articles to clients, WhatsApp groups or the portal; share a link to the article instead.</p>
      <div class="row"><a class="btn small primary" href="${AVB_URL}" target="_blank" rel="noopener noreferrer">Sign up for the free digital edition</a></div></div>`;
  }
  const _vTrainingRead = vTraining; vTraining = function(){ return afterHead(_vTrainingRead(), panel()); };
})();
