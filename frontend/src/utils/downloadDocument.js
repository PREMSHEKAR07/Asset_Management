export const downloadOrOpenGuidelinesPdf = (guidelines) => {
  if (guidelines && guidelines.fileData) {
    // 1. If Base64 Data URL exists from Admin upload:
    const link = document.createElement('a');
    link.href = guidelines.fileData;
    link.download = guidelines.fileName || 'Quadrant_IT_Asset_Guidelines_2026.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Open preview in new window tab
    const win = window.open();
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
        <head><title>${guidelines.title || 'Asset Guidelines Document'}</title></head>
        <body style="margin:0; padding:0; background:#1e293b;">
          <iframe src="${guidelines.fileData}" frameborder="0" style="width:100vw; height:100vh;" allowfullscreen></iframe>
        </body>
        </html>
      `);
    }
  } else {
    // 2. Generate a clean, styled HTML/PDF Document on-the-fly, trigger download and open in new tab!
    const title = guidelines?.title || 'Quadrant IT Services - Asset Policy & Usage Guidelines 2026';
    const version = guidelines?.version || 'v2.4';
    const fileName = (guidelines?.fileName || 'Quadrant_IT_Asset_Policy_2026.pdf').replace(/\.pdf$/i, '.html');
    const date = guidelines?.uploadedDate || new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const summary = guidelines?.summary || 'Official company policy guidelines governing hardware usage, security protocols, return policies, and maintenance procedures.';

    const documentHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #f8fafc;
            color: #0f172a;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 24px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
            padding: 48px;
          }
          .header {
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 24px;
            margin-bottom: 32px;
          }
          .brand-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
          }
          .logo {
            font-size: 20px;
            font-weight: 800;
            color: #1E3A8A;
            letter-spacing: -0.5px;
          }
          .badge {
            background: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #bfdbfe;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
          }
          h1 {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 12px 0;
            line-height: 1.3;
          }
          .meta-info {
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
            display: flex;
            gap: 16px;
          }
          .summary-card {
            background: #eff6ff;
            border: 1px solid #dbeafe;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 32px;
          }
          .summary-title {
            font-size: 12px;
            font-weight: 800;
            color: #1d4ed8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
          }
          .summary-text {
            font-size: 14px;
            color: #1e3a8a;
            line-height: 1.6;
            margin: 0;
          }
          .policy-section {
            margin-bottom: 24px;
            background: #f8fafc;
            border: 1px solid #f1f5f9;
            border-radius: 16px;
            padding: 20px;
          }
          .section-num {
            display: inline-block;
            background: #1E3A8A;
            color: #ffffff;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            text-align: center;
            line-height: 24px;
            font-size: 12px;
            font-weight: 800;
            margin-right: 8px;
          }
          .section-header {
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
          }
          .section-body {
            font-size: 13px;
            color: #475569;
            line-height: 1.6;
            padding-left: 32px;
            margin: 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid #f1f5f9;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand-row">
              <div class="logo">QUADRANT IT SERVICES</div>
              <span class="badge">Official Policy ${version}</span>
            </div>
            <h1>${title}</h1>
            <div class="meta-info">
              <span><strong>Document:</strong> ${guidelines?.fileName || 'Quadrant_IT_Asset_Policy_2026.pdf'}</span>
              <span><strong>Posted Date:</strong> ${date}</span>
              <span><strong>Issuer:</strong> Central IT Desk</span>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-title">Scope & Executive Summary</div>
            <p class="summary-text">${summary}</p>
          </div>

          <div class="policy-section">
            <div class="section-header">
              <span class="section-num">1</span>
              <span>Safe Handling & Equipment Protection</span>
            </div>
            <p class="section-body">All hardware items (laptops, monitors, smartphones, keyboards) remain corporate property of Quadrant IT Services. Employees are obligated to maintain clean physical workspaces, keep liquids away from all electrical devices, and shut down computers periodically to prevent thermal overheating.</p>
          </div>

          <div class="policy-section">
            <div class="section-header">
              <span class="section-num">2</span>
              <span>Authorized Software & Security Compliance</span>
            </div>
            <p class="section-body">Only corporate licensed applications approved by IT Management may be installed. Unauthorized VPNs, P2P torrent client applications, or non-work games are strictly prohibited. Systems are monitored via periodic compliance scans.</p>
          </div>

          <div class="policy-section">
            <div class="section-header">
              <span class="section-num">3</span>
              <span>Fault, Breakage & Theft Incident Reporting</span>
            </div>
            <p class="section-body">Any hardware malfunction, screen damage, or accidental liquid spill must be logged immediately using the Raise Ticket portal. In cases of theft or burglary outside corporate premises, report to local police (FIR) and notify IT within 24 hours.</p>
          </div>

          <div class="policy-section">
            <div class="section-header">
              <span class="section-num">4</span>
              <span>Asset Return & Offboarding Clearance</span>
            </div>
            <p class="section-body">Upon department transfer, role transition, or resignation, all assigned hardware assets, chargers, accessories, and security badges must be returned to Central IT within 48 hours to obtain inventory clearance.</p>
          </div>

          <div class="footer">
            Official Document &bull; Quadrant IT Services Asset Management &copy; 2026. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([documentHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // 1. Download file directly
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 2. Open in new tab for reading
    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
    }
  }
};
