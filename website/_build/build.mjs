// Builds the static pages. Run: node _build/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..');
const SYMBOLS = readFileSync(join(HERE, 'symbols.html'), 'utf8').trimEnd();
const PREVIEWS = JSON.parse(readFileSync(join(HERE, '..', 'assets', 'certs', 'preview', 'manifest.json'), 'utf8'));

const EMAIL = 'ivan.st.vasilev@gmail.com';
const LINKEDIN = 'https://www.linkedin.com/in/ivan-vasilev-6b41721a4';
const CV = 'assets/cv/Ivan-Vasilev-CV.pdf';
const cvBtn = (R) => `<a class="btn btn-ghost" href="${R}${CV}" download="Ivan-Vasilev-CV.pdf" type="application/pdf">${ico('i-download')}Download CV</a>`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ico = (id, cls = '') => `<svg class="ico${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#${id}"/></svg>`;

/* Icon spec: a brand file name ("aws") or "#i-server" for a line icon */
const chip = (R, ic, cls = '') =>
  ic.startsWith('#')
    ? `<span class="chip chip-ink${cls ? ' ' + cls : ''}">${ico(ic.slice(1))}</span>`
    : `<span class="chip${cls ? ' ' + cls : ''}"><img src="${R}assets/icons/${ic}.svg" alt=""></span>`;

/* ---------- Diagrams ---------- */
const node = (R, id, b, s, ic, cls = '', area = true) =>
  `<div class="n${cls ? ' ' + cls : ''}" data-node="${id}"${area ? ` style="grid-area:${id}"` : ''}>${chip(R, ic)}<span class="t"><b>${b}</b><small>${s}</small></span></div>`;
const dg = (cls, edges, narrow, inner) =>
  `<div class="dg ${cls}" data-edges="${edges}" data-edges-narrow="${narrow}">
          <svg class="wires" aria-hidden="true"></svg>
          ${inner.join('\n          ')}
        </div>`;

const DIAGRAMS = {
  ami: (R) => dg('dg-ami', 'jr>lf,lf>pr,pr>ib,ib>as,as>ck', 'jr>lf,lf>pr,pr>ib,ib>as,as>ck', [
    node(R, 'jr', 'Jira ticket', 'SM-412', 'jira'),
    node(R, 'lf', 'Langflow agent', 'Drafts the change', '#i-bot'),
    node(R, 'pr', 'Pull request', 'Reviewed by me', 'github', 'n-hub'),
    node(R, 'ib', 'EC2 Image Builder', 'New AMI, tested', 'aws-ec2'),
    node(R, 'as', 'ASG refresh', 'In batches', 'aws'),
    node(R, 'ck', 'Health check', 'up == 1', 'prometheus'),
  ]),
  mdb: (R) => dg('dg-mdb', 'ap>ms,ms>s1,ms>s2,ms>cf', 'ap>ms,ms>cf,ms>s1,ms>s2', [
    node(R, 'ap', 'App servers', 'Clients', '#i-server'),
    node(R, 'ms', 'mongos', 'Query router', 'mongodb', 'n-hub'),
    node(R, 'cf', 'Config servers', 'Shard metadata', '#i-settings'),
    `<div class="n n-shard" data-node="s1" style="grid-area:s1">${chip(R, '#i-db')}<span class="t"><b>Shard 1</b><small>1,500 qps</small><span class="meter" aria-hidden="true"><b style="--w:60%"></b></span></span></div>`,
    `<div class="n n-shard" data-node="s2" style="grid-area:s2">${chip(R, '#i-db')}<span class="t"><b>Shard 2 <em class="new">new</em></b><small>1,000 qps, 5M+ docs</small><span class="meter" aria-hidden="true"><b style="--w:40%"></b></span></span></div>`,
    `<p class="dg-note" style="grid-area:nt">${ico('i-key')}x.509 member auth</p>`,
  ]),
  mig: (R) => dg('dg-mig', 'src>tar,tar>s3,s3>ec2,ec2>db', 'src>tar,tar>s3,s3>ec2,ec2>db', [
    node(R, 'src', 'On-prem servers', 'Files with hard links', '#i-server'),
    node(R, 'tar', 'tar chunks', 'Links kept inside', '#i-settings'),
    node(R, 's3', 'Amazon S3', 'Carries the chunks', 'aws-s3', 'n-hub'),
    node(R, 'ec2', 'EC2 machine', 'Download and untar', 'aws-ec2'),
    node(R, 'db', 'Databases', 'Started on AWS', '#i-db'),
    `<p class="dg-note" style="grid-area:nt">${ico('i-key')}S3 alone cannot keep hard links</p>`,
  ]),
  sla: (R) => dg('dg-sla', 'my>bc,bc>ne,ne>pm,pm>gf', 'my>bc,bc>ne,ne>pm,pm>gf', [
    node(R, 'my', 'MySQL', 'Behind ProxySQL', 'mysql'),
    node(R, 'bc', 'Bash collectors', 'Uptime checks', 'bash'),
    node(R, 'ne', 'Node exporter', 'Textfile collector', 'linux-tux'),
    node(R, 'pm', 'Prometheus', 'Scrapes and stores', 'prometheus', 'n-hub'),
    node(R, 'gf', 'Grafana', 'SLA and SLO view', 'grafana'),
  ]),
  mon: (R) => `<div class="dg dg-mon" data-edges="ne>pm,my>pm,mo>pm,pg>pm,pm>pd,pm>gf" data-edges-narrow="src>pm,pm>pd,pm>gf">
          <svg class="wires" aria-hidden="true"></svg>
          <div class="grp" data-node="src" style="grid-area:src">
            ${node(R, 'ne', 'Node exporter', 'Linux hosts', 'linux-tux', '', false)}
            ${node(R, 'my', 'mysqld exporter', 'MySQL', 'mysql', '', false)}
            ${node(R, 'mo', 'MongoDB exporter', 'Shards', 'mongodb', '', false)}
            ${node(R, 'pg', 'Pushgateway', 'Bash collectors', '#i-server', '', false)}
          </div>
          ${node(R, 'pm', 'Prometheus', 'Alert rules', 'prometheus', 'n-hub')}
          ${node(R, 'pd', 'PagerDuty', 'On-call', 'pagerduty')}
          ${node(R, 'gf', 'Grafana', 'Dashboards', 'grafana')}
        </div>`,
  pup: (R) => dg('dg-pup', 'fm>hs,ag>db', 'fm>hs,ag>db', [
    node(R, 'fm', 'Foreman', 'Deploys new versions', '#i-ship'),
    node(R, 'hs', 'IBM and Linux hosts', 'Run the new version', '#i-server'),
    node(R, 'ag', 'Custom agents', 'Patch each host', '#i-bot'),
    node(R, 'db', 'Patch database', 'Status of every host', '#i-db', 'n-hub'),
  ]),
  ci: (R) => dg('dg-ci', 'gh>rn,rn>ts,ts>dp,dp>sd,sd>rb', 'gh>rn,rn>ts,ts>dp,dp>sd,sd>rb', [
    node(R, 'gh', 'git push', 'main branch', 'github'),
    node(R, 'rn', 'Self-hosted runner', 'GitHub Actions', 'github-actions', 'n-hub'),
    node(R, 'ts', 'Maven tests', 'Testcontainers', '#i-check'),
    node(R, 'dp', 'Ship the JAR', 'SSH and SCP', '#i-server'),
    node(R, 'sd', 'systemd restart', 'Health check', 'linux-tux'),
    node(R, 'rb', 'Rollback', 'Previous JAR', '#i-back'),
  ]),
  lab: (R) => dg('dg-lab', 'wan>pf,pf>hp,hp>k8,hp>vw', 'wan>pf,pf>hp,hp>k8,hp>vw', [
    node(R, 'wan', 'Internet', 'Home line', '#i-monitor'),
    node(R, 'pf', 'pfSense', 'Firewall, VLANs', '#i-key', 'n-hub'),
    node(R, 'hp', 'HAProxy', 'ACME certificates', '#i-settings'),
    node(R, 'k8', 'Kubernetes VMs', 'On Proxmox', '#i-server'),
    node(R, 'vw', 'Vaultwarden', 'Self-hosted', '#i-key'),
    `<p class="dg-note" style="grid-area:nt">${ico('i-monitor')}Wazuh, Prometheus and Grafana watch it all</p>`,
  ]),
  kio: (R) => dg('dg-kio', 'usb>lg,lg>ks,ks>xr,xr>tm,tm>ok', 'usb>lg,lg>ks,ks>xr,xr>tm,tm>ok', [
    node(R, 'usb', 'GParted Live USB', 'Kiosk image built in', '#i-usb', 'n-hub'),
    node(R, 'lg', 'Auto-login', 'Kiosk user', 'linux-tux'),
    node(R, 'ks', 'Kiosk session', 'One full-screen app', '#i-monitor'),
    node(R, 'xr', 'xrandr', 'Screen rotated', '#i-monitor'),
    node(R, 'tm', 'Touch matrix', 'Remapped with xinput', '#i-settings'),
    node(R, 'ok', 'Touch input', 'Taps line up', '#i-check'),
  ]),
  vpn: (R) => dg('dg-vpn', 'us>fw,fw>ov,ov>lan', 'us>fw,fw>ov,ov>lan', [
    node(R, 'us', 'Remote staff', 'Own client profile', '#i-monitor'),
    node(R, 'fw', 'Firewall', 'Only the VPN port', '#i-key'),
    node(R, 'ov', 'OpenVPN server', 'TLS tunnel', 'openvpn', 'n-hub'),
    node(R, 'lan', 'Office network', 'Only pushed routes', '#i-server'),
    `<p class="dg-note" style="grid-area:nt">${ico('i-key')}Own CA: one certificate per user, revoked one by one</p>`,
  ]),
  vbr: (R) => dg('dg-vbr', 'vb>ck,ck>zb,zb>al', 'vb>ck,ck>zb,zb>al', [
    node(R, 'vb', 'Veeam B&amp;R server', 'Backup jobs', 'veeam'),
    node(R, 'ck', 'Job checks', 'State of every job', '#i-cal'),
    node(R, 'zb', 'Zabbix', 'Triggers per state', '#i-monitor', 'n-hub'),
    node(R, 'al', 'Alerts', 'Failed or stuck jobs', '#i-chat'),
    `<ul class="dg-states" style="grid-area:nt" aria-label="Job states tracked"><li class="st-ok">Success</li><li class="st-run">Running</li><li class="st-warn">Warning</li><li class="st-fail">Failed</li></ul>`,
  ]),
};

/* ---------- Content ---------- */
const PROJECTS = [
  {
    slug: 'ai-ami-rollout', title: 'AI-assisted AMI rollout', where: 'PROS', icon: 'aws', tool: 'AWS',
    short: 'A Langflow agent turns a Jira ticket into a pull request I review, a new AMI and an ASG refresh in batches.',
    lead: 'A Langflow agent turns a deployment ticket into a pull request, a new AMI and a rolling Auto Scaling refresh. I approve every step that changes AWS.',
    stack: [['Langflow', '#i-bot'], ['Python', 'python'], ['Jira', 'jira'], ['GitHub', 'github'], ['EC2 Image Builder', 'aws-ec2'], ['Auto Scaling', 'aws']],
    diagram: 'ami', caption: 'Ticket to rollout, with a human in the middle',
    problem: 'Shipping a new package version to AWS meant the same manual steps every time: read the ticket, bump version pins, build an image, roll it out. Repetitive work like that is where mistakes happen.',
    steps: [
      'The agent reads the Jira ticket and signs in through AWS SSO.',
      'It checks existing AMIs by their package tags, so it never rebuilds an image that already exists.',
      'It edits only the requested version pins, checks the diff and opens a pull request.',
      'I review and merge. EC2 Image Builder builds the new AMI and tests that services start and exporters answer.',
      'The agent updates the Auto Scaling image pins and starts an instance refresh in batches.',
      'Prometheus confirms every target is back, and the agent reports requested versus actual versions.',
    ],
    note: ['Guardrails', 'The agent never touches unrelated config, never guesses a match, and nothing reaches production without my explicit yes.'],
    result: 'A repetitive manual deployment became one reviewed flow, and every change can be traced in Git and Jira.',
  },
  {
    slug: 'mongodb-second-shard', title: 'Second MongoDB shard, x.509 auth', where: 'PROS', icon: 'mongodb', tool: 'MongoDB',
    short: 'Designed and added a second production shard from scratch, then balanced 5M+ documents onto it with zero downtime.',
    lead: 'One shard was serving all 2,500 queries per second. I designed a second shard from scratch, secured it with x.509, and moved 5M+ documents onto it without downtime.',
    facts: [['5M+', 'documents moved'], ['2,500 qps', 'split 1,500 / 1,000'], ['0', 'downtime']],
    stack: [['MongoDB', 'mongodb'], ['x.509 / TLS', '#i-key'], ['Foreman', '#i-cal'], ['Puppet', 'puppet-icon'], ['Grafana', 'grafana']],
    diagram: 'mdb', caption: 'Two shards behind mongos',
    problem: 'A production sharded cluster was running everything on a single shard. Data and traffic kept growing and there was no headroom left.',
    steps: [
      'Designed primary, secondary and arbiter replica sets that reuse existing capacity, so only one new machine was needed.',
      'Checked failure domains so that losing any single host never removes two votes from the same shard.',
      'Provisioned the new host with Foreman. Puppet manages the mongod configs and services.',
      'Turned on TLS and x.509 member authentication, with authorization enabled.',
      'Added the replica set through mongos and let the balancer migrate chunks onto it.',
    ],
    result: 'Traffic now splits roughly 1,500 / 1,000 queries per second across two shards, and the cluster has room to grow.',
  },
  {
    slug: '21tb-migration-to-aws', title: '21 TB database move to AWS', where: 'PROS', icon: 'aws-s3', tool: 'Amazon S3',
    short: 'S3 cannot store hard links, so the data went up as tar chunks and was unpacked on EC2 with every link intact.',
    lead: 'I moved 21 TB of database files from on-prem servers to AWS. S3 cannot store hard links, so I packed the data into tar chunks, carried them through S3 and unpacked them on EC2 with every link intact.',
    facts: [['tar chunks', 'carried through S3'], ['hard links', 'kept intact'], ['1:1', 'size after restore']],
    stack: [['Bash', 'bash'], ['tar', '#i-settings'], ['Amazon S3', 'aws-s3'], ['Amazon EC2', 'aws-ec2']],
    diagram: 'mig', caption: 'tar keeps the links, S3 carries the chunks',
    problem: 'The databases had to move to EC2 by way of S3, but their files rely on hard links. S3 stores plain objects and has no idea what a hard link is, so uploading the files directly would have turned every link into a separate full copy and blown up the data set.',
    steps: [
      'Packed the data into tar archives split into chunks. tar records a hard link as a link, not as a second copy of the file.',
      'Uploaded the tar chunks to S3, which served as the transfer point between on-prem and AWS.',
      'Downloaded the chunks onto the EC2 machine and unpacked them there, which rebuilt every hard link exactly as it was.',
      'Checked that the restored data matched the source size, then started the databases from it.',
    ],
    note: ['Why tar', 'S3 can carry the bytes but not the links between files. tar wraps the links inside the archive, so they survive the trip and come back when it is unpacked.'],
    result: 'The databases came up on EC2 with every hard link intact and the same size as the source.',
  },
  {
    slug: 'mysql-sla-slo', title: 'MySQL SLA and SLO monitoring', where: 'PROS', icon: 'mysql', tool: 'MySQL',
    short: 'Uptime targets for MySQL behind ProxySQL, measured by Bash collectors and shown in Grafana.',
    lead: 'I defined uptime SLA and SLO targets for MySQL behind ProxySQL, then built the metrics that show whether we meet them.',
    stack: [['MySQL', 'mysql'], ['ProxySQL', '#i-db'], ['Bash', 'bash'], ['Prometheus', 'prometheus'], ['Grafana', 'grafana']],
    diagram: 'sla', caption: 'From a Bash check to an SLO panel',
    problem: 'MySQL uptime was not measured against a target, so availability was a feeling rather than a number.',
    steps: [
      'Defined the SLA and SLO targets for uptime.',
      'Wrote Bash collectors that check MySQL and ProxySQL and write the results as metrics.',
      'Node exporter picks them up through its textfile collector, so Prometheus scrapes them with everything else.',
      'Built Grafana dashboards that show availability against the target.',
    ],
    result: 'Uptime is now a number on a dashboard, measured against an agreed target.',
  },
  {
    slug: 'monitoring-and-on-call', title: 'Monitoring and on-call', where: 'PROS', icon: 'prometheus', tool: 'Prometheus',
    short: 'Exporters on every host, Bash jobs through Pushgateway, alerts paged through PagerDuty.',
    lead: 'Prometheus, Grafana and Loki across the fleet, with alerts tuned so PagerDuty only wakes the on-call for something real.',
    stack: [['Prometheus', 'prometheus'], ['Grafana', 'grafana'], ['Loki', '#i-monitor'], ['Wazuh', '#i-key'], ['PagerDuty', 'pagerduty']],
    diagram: 'mon', caption: 'Exporters to alerts',
    problem: 'Hosts and databases need to be watched around the clock, and noisy alerts teach people to ignore the pager.',
    steps: [
      'Node and process exporters on Linux hosts, plus mysqld and MongoDB exporters on the databases.',
      'Bash jobs push custom metrics through Pushgateway.',
      'Logs go to Loki. Wazuh covers security events.',
      'Prometheus alert rules page the on-call rotation through PagerDuty. I am part of that rotation.',
      'I tune noisy alerts and add custom metrics where an incident shows a gap.',
    ],
    result: 'One place to see the fleet, and pages that point at a real problem.',
  },
  {
    slug: 'fleet-patching', title: 'Fleet deployments and patching', where: 'PROS', icon: '#i-ship', tool: 'Foreman',
    short: 'Foreman deploys new versions, and custom agents patch the hosts and report to a central database.',
    lead: 'Two separate jobs across on-prem and hybrid IBM and Linux fleets. Foreman deploys new versions to the hosts, and patching runs through custom agents that record every result in a central database.',
    stack: [['Foreman', '#i-ship'], ['Custom agents', '#i-bot'], ['Patch database', '#i-db'], ['Linux', 'linux-tux'], ['Bash', 'bash']],
    diagram: 'pup', caption: 'Foreman deploys, agents patch',
    problem: 'Deploying and patching by hand across many IBM and Linux hosts is slow, and it is easy to lose track of which host runs which version and which ones are still waiting for a patch.',
    steps: [
      'Deployments go through Foreman, which rolls new versions out to the hosts.',
      'Patching is a separate path: custom agents on the hosts apply the patches.',
      'Each agent writes its result to a central database.',
      'The database shows which hosts are patched, which are pending and which failed, so nothing slips through.',
    ],
    result: 'Deployments are repeatable through Foreman, and the patch state of every host lives in one database.',
  },
  {
    slug: 'veeam-backup-monitoring', title: 'Veeam backup monitoring', where: 'Radioactive', icon: 'veeam', tool: 'Veeam',
    short: 'Every backup job tracked: succeeded, still running, warning or failed, with an alert when one needs attention.',
    lead: 'I built monitoring for the Veeam backup server and every job on it, so we always knew whether last night\'s backups succeeded, were still running, or failed.',
    stack: [['Veeam Backup &amp; Replication', 'veeam'], ['Zabbix', '#i-monitor'], ['Windows Server', '#i-server']],
    diagram: 'vbr', caption: 'Every job, every state',
    problem: 'Backups were only checked when someone remembered to open the Veeam console. A failed or stuck job could go unnoticed until the day a restore was needed.',
    steps: [
      'Monitored the Veeam backup server itself, so we knew it was up and its services were running.',
      'Tracked every backup job and its last result: success, warning or failed.',
      'Flagged jobs that were still running long after they should have finished.',
      'Added triggers per state, so a failed or stuck job raises an alert instead of waiting to be found.',
    ],
    result: 'Backup health became visible at a glance, and a failed job turned into an alert the same day instead of a surprise during a restore.',
  },
  {
    slug: 'linux-touchscreen-kiosk', title: 'Linux touchscreen kiosk', where: 'Helpdesk', icon: 'linux-tux', tool: 'Linux',
    short: 'A locked-down Linux kiosk, installed and updated from a custom GParted USB, with touch remapped to match the screen.',
    lead: 'I turned Linux into a single-purpose touchscreen kiosk, packed it into a custom GParted USB that installs or updates it on any machine, and remapped the touch matrix so every tap lands under the finger.',
    stack: [['Linux', 'linux-tux'], ['GParted Live USB', '#i-usb'], ['Xorg and xrandr', '#i-monitor'], ['xinput', '#i-settings'], ['Bash', 'bash']],
    diagram: 'kio', caption: 'From one USB stick to a working kiosk',
    problem: 'The screens had to run one app and nothing else, and every machine needed the same setup and the same version. They were mounted in an orientation the panels did not use by default, and after rotating the picture, touches still landed in the old orientation.',
    steps: [
      'Set up a dedicated user that logs in on its own and starts straight into one full-screen app.',
      'Locked the session down, so people cannot leave the app or reach the desktop.',
      'Rotated the display with xrandr to match how the screen is mounted.',
      'Remapped the touchscreen with an xinput coordinate transformation matrix, so the touch axes turn together with the picture.',
      'Made the rotation and the matrix apply on every boot, then tested taps in every corner.',
      'Built a custom GParted Live USB with the kiosk image and my own components packed inside it.',
      'Booting a machine from that USB deploys the full kiosk onto its disk, so a new kiosk needs only the stick.',
      'The same USB ships new versions: boot it on an existing kiosk and it moves to the latest build.',
    ],
    note: ['Why a matrix', 'Rotating the screen does not rotate the touch layer. The 3 by 3 matrix swaps and flips the X and Y axes, so touch follows the picture in any rotation.'],
    result: 'Any machine becomes the same kiosk from one USB stick, updates go out the same way, and touch lines up in whatever rotation the screen is mounted.',
  },
  {
    slug: 'openvpn-remote-access', title: 'OpenVPN remote access', where: 'Helpdesk', icon: 'openvpn', tool: 'OpenVPN',
    short: 'Remote access to office networks, with a certificate per user and only the routes they need.',
    lead: 'I set up OpenVPN so people could reach their office network from anywhere, with a certificate for every user and only the routes they need.',
    stack: [['OpenVPN', 'openvpn'], ['Own CA', '#i-key'], ['Linux', 'linux-tux'], ['Firewall rules', '#i-settings']],
    diagram: 'vpn', caption: 'One tunnel, one certificate per person',
    problem: 'People needed office systems from home and on the road, without those systems being exposed to the internet.',
    steps: [
      'Built a small certificate authority, so the server and every user get their own certificate.',
      'Configured the OpenVPN server with a TLS tunnel, and pushed only the routes each network needs.',
      'Made a ready-to-import client profile for each user.',
      'Opened only the VPN port on the firewall and kept the office systems off the public internet.',
      'Revoking one certificate cuts off one person without touching anyone else.',
    ],
    result: 'Staff work remotely over an encrypted tunnel, and access is granted or taken away per person.',
  },
  {
    slug: 'spring-boot-ci-cd', title: 'Spring Boot CI/CD', where: 'Lab', icon: 'github-actions', tool: 'GitHub Actions',
    short: 'Releases gated on tests, shipped over SSH, with automatic JAR rollback.',
    lead: 'A home-lab pipeline that only ships a Spring Boot release when the tests pass, and rolls back on its own when the service does not come up.',
    stack: [['GitHub Actions', 'github-actions'], ['Maven', '#i-settings'], ['Testcontainers', '#i-check'], ['Docker Compose', '#i-server'], ['Keycloak', '#i-key']],
    diagram: 'ci', caption: 'Ship on green, undo on red',
    problem: 'I wanted backend releases that cannot leave a broken service behind, without paying for hosted runners.',
    steps: [
      'GitHub Actions jobs run on my own self-hosted runners.',
      'Maven builds the app and runs the tests, with Testcontainers starting real databases.',
      'Only a green build ships: the JAR goes to the server over SCP.',
      'systemd restarts the service and a health check confirms it is up.',
      'If the check fails, the previous JAR is put back.',
      'Docker Compose runs the supporting stacks: PostgreSQL, Redis, Keycloak and monitoring.',
    ],
    result: 'Releases ship on green and undo themselves on red.',
  },
  {
    slug: 'proxmox-home-lab', title: 'Proxmox and Kubernetes home lab', where: 'Lab', icon: '#i-server', tool: 'Proxmox',
    short: 'Kubernetes VMs behind pfSense with VLANs, HAProxy and Wazuh.',
    lead: 'My own small data center: Kubernetes VMs on Proxmox behind pfSense. It is where I try things before I use them at work.',
    stack: [['Proxmox', '#i-server'], ['Kubernetes', '#i-settings'], ['pfSense', '#i-key'], ['HAProxy', '#i-settings'], ['Wazuh', '#i-key'], ['Grafana', 'grafana']],
    diagram: 'lab', caption: 'Segmented, proxied, watched',
    problem: 'Some things are only learned by breaking them, and production is not the place for that.',
    steps: [
      'Proxmox hosts the VMs, including a small Kubernetes cluster.',
      'pfSense handles the firewall and splits the network into VLANs.',
      'HAProxy routes traffic in, with ACME certificates.',
      'Self-hosted services such as Vaultwarden run behind it.',
      'Wazuh watches security events. Prometheus and Grafana watch everything else.',
    ],
    result: 'A safe place to break things and learn how to fix them.',
  },
];
const bySlug = Object.fromEntries(PROJECTS.map((p) => [p.slug, p]));

const JOBS = [
  {
    company: 'PROS', full: 'PROS Bulgaria', role: 'Site Reliability Engineer II', when: 'Sep 2023 to now', place: 'Sofia', now: true,
    summary: 'I look after the databases, Linux fleets and AWS foundations behind PROS products.',
    duties: [
      'Own database reliability for sharded MongoDB with x.509 auth and MySQL behind ProxySQL: capacity, scaling, backups and incidents.',
      'Deploy new versions with Foreman, and patch on-prem and hybrid IBM and Linux fleets with custom agents and a patch database.',
      'Run monitoring and on-call: Prometheus, Grafana, Loki, Wazuh and PagerDuty, with custom metrics and tuned alerts.',
      'Operate the delivery path: GoCD and GitHub Actions, Nginx and HAProxy, and AWS foundations such as EC2, S3, IAM and VPCs.',
      'Write Bash and Python tools that take repetitive work off the team.',
      'Build Langflow agents that open pull requests and Jira tickets and drive AWS image rollouts, always with a human review.',
    ],
    projects: ['ai-ami-rollout', 'mongodb-second-shard', '21tb-migration-to-aws', 'mysql-sla-slo', 'monitoring-and-on-call', 'fleet-patching'],
  },
  {
    company: 'Radioactive', full: 'Radioactive EOOD', role: 'System Administrator', when: 'Jan to Aug 2023', place: 'Sofia',
    summary: 'Servers and networks for a small company, end to end.',
    duties: [
      'Ran Linux and Windows servers: patching, backups and access management.',
      'Monitored them with Nagios and Zabbix, and scripted routine work in Bash and Python.',
      'Built WireGuard and OpenVPN access, VLAN segmentation, and Cisco and pfSense networks.',
      'Built monitoring for the Veeam backup server and its jobs: succeeded, running, warning or failed.',
    ],
    projects: ['veeam-backup-monitoring'],
  },
  {
    company: 'Helpdesk Bulgaria', full: 'Helpdesk Bulgaria', role: 'System Administrator', when: 'Dec 2021 to Dec 2022', place: 'Sofia',
    summary: 'Second-line support for client infrastructure.',
    duties: [
      'Second-line support for client servers, workstations and networks.',
      'Helped end users day to day with printers, drivers and everyday computer problems.',
      'Built a Linux touchscreen kiosk, deployed and updated from a custom GParted USB, with the touch matrix remapped to the rotated display.',
      'Set up and maintained OpenVPN remote access, with per-user certificates and client profiles.',
    ],
    projects: ['linux-touchscreen-kiosk', 'openvpn-remote-access'],
  },
  {
    company: 'Behr-Hella Thermocontrol', full: 'Behr-Hella Thermocontrol EOOD', role: 'R&D Hardware Engineer', when: 'Feb to Nov 2021', place: 'Sofia',
    summary: 'Where I started: electronics for cars.',
    duties: ['Developed and tested embedded hardware for automotive climate-control units.'],
    projects: [],
  },
];

const CERTS = [
  ['aws', 'Architecting on AWS', 'architecting-on-aws'],
  ['aws', 'AWS Technical Essentials', 'aws-technical-essentials'],
  ['aws', 'AWS Security Fundamentals', 'aws-security-fundamentals'],
  ['fortinet', 'Fortinet NSE 1', 'fortinet-nse-1'],
  ['fortinet', 'Fortinet NSE 2', 'fortinet-nse-2'],
  ['fortinet', 'Fortinet NSE 3', 'fortinet-nse-3'],
  ['cisco', 'Cisco Learning Transcript', 'cisco-learning-transcript'],
];

const SKILLS = [
  ['Cloud', 'AWS EC2, S3, Image Builder, Auto Scaling, IAM and SSO, CloudWatch'],
  ['Automation', 'Puppet, Ansible, Foreman, GitHub Actions, GoCD, Langflow'],
  ['Observability', 'Prometheus, Grafana, Loki, Wazuh, PagerDuty, Nagios, Zabbix'],
  ['Databases', 'MongoDB, MySQL, ProxySQL'],
  ['Systems and code', 'Linux (RHEL, Debian), Windows, Bash, Python, C and C++'],
  ['Network and web', 'Nginx, HAProxy, Apache, Caddy, Tomcat, WireGuard, VLANs, pfSense'],
];

/* ---------- Shell ---------- */
const NAV = [['about', 'About', ''], ['projects', 'Projects', 'projects/'], ['experience', 'Experience', 'experience/'], ['education', 'Education', 'education/']];
const href = (R, path) => (R + path) || './';

function page({ R, active, title, desc, body, ogTitle }) {
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(ogTitle || title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${R}share.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0a0e0c">
<link rel="icon" href="${R}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${R}apple-touch-icon.png">
<link rel="preload" href="${R}site/fonts/schibsted-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin>
<script>
  (function () {
    var d = document.documentElement, t = null;
    try { t = new URLSearchParams(location.search).get('theme') || localStorage.getItem('theme'); } catch (e) {}
    if (t !== 'light' && t !== 'dark') t = 'dark';
    d.setAttribute('data-theme', t);
    d.classList.add('js');
    document.querySelector('meta[name="theme-color"]').setAttribute('content', t === 'light' ? '#f5f7f6' : '#0a0e0c');
  })();
</script>
<link rel="stylesheet" href="${R}site/site.css">
<script src="${R}site/site.js" defer></script>
</head>
<body>
<svg class="sprite" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
${SYMBOLS}
</svg>

<a class="skip" href="#main">Skip to content</a>

<header class="nav-wrap">
  <nav class="nav" aria-label="Main">
    <a class="mark" href="${href(R, '')}" aria-label="Ivan Vasilev, about">
      <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="32" class="mark-bg"/><g class="mark-fg"><path d="M20 29v16M29 29l7.5 16L44 29"/></g><circle cx="20" cy="19" r="4.4" class="mark-dot"/></svg>
      <span>Ivan Vasilev</span>
    </a>
    <ul class="nav-links">
      <li class="pill-ind" aria-hidden="true"></li>
${NAV.map(([k, label, p]) => `      <li><a href="${href(R, p)}"${k === active ? ' aria-current="page"' : ''}>${label}</a></li>`).join('\n')}
    </ul>
    <div class="nav-end">
      <button class="theme-btn" type="button" aria-label="Switch to light theme">
        ${ico('i-sun', 'ico-sun')}
        ${ico('i-moon', 'ico-moon')}
      </button>
      <a class="btn btn-accent btn-sm" href="mailto:${EMAIL}">Email</a>
    </div>
  </nav>
</header>
<nav class="tabbar" aria-label="Pages">
  <ul>
    <li class="pill-ind" aria-hidden="true"></li>
${NAV.map(([k, label, p]) => `    <li><a href="${href(R, p)}"${k === active ? ' aria-current="page"' : ''}>${label}</a></li>`).join('\n')}
  </ul>
</nav>

<main id="main">
${body}
  <section class="wrap" id="contact" aria-labelledby="ct-h">
    <div class="cta">
      <img class="portrait" src="${R}assets/img/ivan.png" width="290" height="293" alt="Ivan Vasilev">
      <div class="cta-copy">
        <h2 id="ct-h">Hiring an SRE for AWS?</h2>
        <p>Databases, monitoring and automation that stay up.</p>
      </div>
      <div class="actions">
        <a class="btn btn-accent" href="mailto:${EMAIL}">${ico('i-mail')}Email me</a>
        <a class="btn btn-ghost" href="${LINKEDIN}" target="_blank" rel="noopener">${ico('i-in', 'ico-fill')}LinkedIn</a>
        ${cvBtn(R)}
      </div>
    </div>
  </section>
</main>

<footer class="foot wrap">
  <p>© 2026 Ivan Vasilev. Product names and logos are trademarks of their owners.</p>
  <a href="#main">Back to top</a>
</footer>
</body>
</html>
`;
}

const whereTag = (w) => `<span class="where where-${w.toLowerCase()}" title="Company">${ico(w === 'Lab' ? 'i-server' : 'i-building')}${w === 'Lab' ? 'Home lab' : w}</span>`;
const projTag = (R, p) => `<a class="tag" href="${R}projects/${p.slug}/">${chip(R, p.icon)}${esc(p.title)}</a>`;
const pageHead = (h1, lead, extra = '') => `  <header class="page-head wrap">
    <h1>${h1}</h1>
    <p class="lead">${lead}</p>${extra}
  </header>
`;

/* ---------- About ---------- */
function about() {
  const R = '';
  const body = `  <section class="hero wrap" id="top">
    <div class="hero-copy">
      <p class="hello"><span class="dot" aria-hidden="true"></span>Hi, I'm Ivan Vasilev</p>
      <h1>I make systems <em>reliable</em> and keep them that way.</h1>
      <p class="lead">I'm a site reliability engineer at PROS in Sofia, working with MongoDB, MySQL, Linux and AWS. If I have to do something twice, I automate it.</p>
      <div class="actions">
        <a class="btn btn-accent" href="projects/">See my projects${ico('i-arrow')}</a>
        <a class="btn btn-ghost" href="mailto:${EMAIL}">${ico('i-mail')}Email me</a>
        ${cvBtn(R)}
      </div>
    </div>

    <figure class="me" aria-label="About Ivan in short">
      <div class="me-head">
        <img class="me-photo" src="assets/img/ivan.png" width="290" height="293" alt="Ivan Vasilev">
        <figcaption><b>Ivan Vasilev</b><span>Site Reliability Engineer II</span></figcaption>
      </div>
      <dl class="me-rows">
        <div><dt>${ico('i-pin')}Based in</dt><dd>Sofia, Bulgaria</dd></div>
        <div><dt>${ico('i-chat')}Speaks</dt><dd>Bulgarian, English</dd></div>
        <div><dt>${ico('i-server')}Works at</dt><dd>PROS, since 2023</dd></div>
        <div><dt>${ico('i-book')}Learning</dt><dd>AWS and Kubernetes</dd></div>
        <div><dt>${ico('i-ski')}Off the clock</dt><dd>Skiing, ice skating, driving</dd></div>
      </dl>
    </figure>
  </section>

  <section class="section wrap split" aria-labelledby="who-h">
    <h2 id="who-h">From circuit boards to databases</h2>
    <div class="prose">
      <p>I started in 2021 as an R&amp;D hardware engineer, testing embedded electronics for car climate control. It taught me to measure before I change anything, and I still work that way.</p>
      <p>Later that year I moved into system administration, and in 2023 I joined PROS as a site reliability engineer. Today I run sharded MongoDB and MySQL, keep Linux fleets patched, carry the pager and build the tools that make all of that repeatable.</p>
      <ol class="path" aria-label="Career path">
        <li><span class="yr">2021</span><b>Hardware engineer</b></li>
        <li><span class="yr">2021</span><b>System administrator</b></li>
        <li class="on"><span class="yr">2023 <span class="now">to now</span></span><b>Site reliability engineer</b></li>
      </ol>
    </div>
  </section>

  <section class="section wrap off" aria-labelledby="off-h">
    <div class="off-head">
      <h2 id="off-h">Outside work</h2>
      <p>Away from the pager you will find me on the snow, on the road or around a table with friends. And yes, still tinkering.</p>
    </div>
    <ul class="hobbies" aria-label="Hobbies">
      <li>${chip(R, '#i-skate')}<b>Ice skating</b><span>Winter evenings on the rink.</span></li>
      <li>${chip(R, '#i-ski')}<b>Skiing</b><span>Bansko or Borovets when the snow is good.</span></li>
      <li>${chip(R, '#i-users')}<b>Friends</b><span>Long dinners and weekend trips together.</span></li>
      <li>${chip(R, '#i-car')}<b>Driving</b><span>Because why not. A good road and a long playlist.</span></li>
      <li>${chip(R, '#i-book')}<b>Reading</b><span>A little. Tech books and the odd novel.</span></li>
      <li>${chip(R, '#i-film')}<b>Movies</b><span>Now and then, on a slow Sunday.</span></li>
      <li>${chip(R, '#i-hike')}<b>Hiking</b><span>Vitosha is twenty minutes from Sofia.</span></li>
      <li>${chip(R, '#i-plane')}<b>Travel</b><span>New cities, ideally by car.</span></li>
    </ul>
    <ul class="off-grid">
      <li>${chip(R, '#i-server')}<b>A rack at home</b><span>Proxmox, pfSense and a small Kubernetes cluster. It is where I try an idea before I would ever suggest it at work.</span></li>
      <li>${chip(R, '#i-book')}<b>Notes in Obsidian</b><span>I keep my own knowledge base in Obsidian, with study guides for whatever I am learning, like a step-by-step guide to Kubernetes.</span></li>
      <li>${chip(R, '#i-settings')}<b>Hardware at heart</b><span>I studied electronic systems at TUES and started out testing circuit boards. I still like to know how a thing works all the way down.</span></li>
    </ul>
  </section>

  <section class="section wrap split" aria-labelledby="like-h">
    <h2 id="like-h">What I enjoy</h2>
    <ul class="likes">
      <li><b>Making work disappear.</b> If I do something twice by hand, it becomes a script.</li>
      <li><b>Changing things carefully.</b> A new MongoDB shard balanced with zero downtime, and databases moved to AWS without losing a byte.</li>
      <li><b>Learning in depth.</b> I write my own study guides. Right now: AWS and Kubernetes.</li>
      <li><b>Useful AI.</b> Agents that take the boring steps, with a person approving every change.</li>
    </ul>
  </section>

  <section class="section wrap split" aria-labelledby="do-h">
    <h2 id="do-h">What I do</h2>
    <dl class="do-list">
      <div><dt>${chip(R, '#i-db')}Databases</dt><dd>Sharded MongoDB and MySQL behind ProxySQL. Capacity, scaling, backups and incidents.</dd></div>
      <div><dt>${chip(R, '#i-ship')}Deployments</dt><dd>New application versions shipped as tested AMIs on AWS and rolled out in batches, so a bad build never reaches every host at once.</dd></div>
      <div><dt>${chip(R, '#i-cal')}Patching</dt><dd>Custom agents patch IBM and Linux hosts and report every result to a central database.</dd></div>
      <div><dt>${chip(R, '#i-monitor')}On-call</dt><dd>Prometheus, Grafana and Loki, with alerts that page through PagerDuty only when it matters.</dd></div>
      <div><dt>${chip(R, '#i-bot')}Automation</dt><dd>Bash and Python tools, and Langflow agents that open pull requests for a human to review.</dd></div>
    </dl>
  </section>

  <section class="section wrap split" aria-labelledby="kit-h">
    <h2 id="kit-h">Toolbox</h2>
    <dl class="kit">
${SKILLS.map(([k, v]) => `      <div><dt>${k}</dt><dd>${v}</dd></div>`).join('\n')}
    </dl>
  </section>

  <section class="section wrap" aria-labelledby="more-h">
    <h2 id="more-h" class="sr">More about my work</h2>
    <ul class="go">
      <li><a href="projects/"><b>Projects</b><span>Eleven projects and how I built each one</span>${ico('i-arrow')}</a></li>
      <li><a href="experience/"><b>Experience</b><span>Four roles since 2021, and what I owned in each</span>${ico('i-arrow')}</a></li>
      <li><a href="education/"><b>Education</b><span>Certificates, school and what I am learning now</span>${ico('i-arrow')}</a></li>
    </ul>
  </section>
`;
  return page({
    R, active: 'about', title: 'Ivan Vasilev: site reliability engineer, Sofia',
    desc: 'Ivan Vasilev is a site reliability engineer at PROS in Sofia. He runs sharded MongoDB and MySQL, Linux fleets and AWS, and automates the repetitive parts.',
    body,
  });
}

/* ---------- Projects index ---------- */
function projectsIndex() {
  const R = '../';
  const rows = PROJECTS.map((p) => `      <li><a class="proj" href="${p.slug}/">
        ${chip(R, p.icon, 'chip-lg')}
        <div class="proj-main"><h2>${esc(p.title)}</h2><p>${esc(p.short)}</p></div>
        <span class="proj-tool">${p.tool}</span>${whereTag(p.where)}${ico('i-arrow', 'go-ico')}
      </a></li>`).join('\n');
  const body = pageHead('Projects', 'Six from PROS, one from Radioactive, two from Helpdesk Bulgaria and two from my home lab. Each page shows how the system fits together and how I built it.') + `
  <section class="wrap page-body" aria-label="All projects">
    <div class="proj-head" aria-hidden="true"><span>Project</span><span>Main tool</span><span>Company</span></div>
    <ol class="projects">
${rows}
    </ol>
  </section>
`;
  return page({ R, active: 'projects', title: 'Projects: Ivan Vasilev', desc: 'MongoDB sharding, a database move to AWS, AI-assisted AMI rollouts, monitoring, patching, Veeam backup monitoring, a Linux kiosk, OpenVPN and home-lab projects by Ivan Vasilev.', body });
}

/* ---------- Project detail ---------- */

function projectPage(p, i) {
  const R = '../../';
  const prev = PROJECTS[(i - 1 + PROJECTS.length) % PROJECTS.length];
  const next = PROJECTS[(i + 1) % PROJECTS.length];
  const job = JOBS.find((j) => j.projects.includes(p.slug));
  const facts = p.facts ? `\n    <ul class="facts">${p.facts.map(([b, t]) => `<li><b>${b}</b> ${t}</li>`).join('')}</ul>` : '';
  const body = `  <header class="page-head wrap">
    <a class="crumb" href="../">${ico('i-back')}All projects</a>
    <h1>${esc(p.title)}</h1>
    <p class="lead">${esc(p.lead)}</p>${facts}
  </header>

  <div class="case wrap">
    <aside class="glance" aria-label="At a glance">
      <dl>
        <div><dt>Where</dt><dd>${job ? `${job.full}` : 'My home lab'}</dd></div>
        <div><dt>Role</dt><dd>${job ? job.role : 'Personal project'}</dd></div>
        <div><dt>Stack</dt><dd><ul class="stack">${p.stack.map(([n, ic]) => `<li>${chip(R, ic)}${n}</li>`).join('')}</ul></dd></div>
      </dl>
    </aside>

    <article class="case-main">
      <figure class="frame">
        <figcaption><h2>${esc(p.caption)}</h2></figcaption>
        ${DIAGRAMS[p.diagram](R)}
      </figure>

      <section aria-labelledby="pb-h">
        <h2 id="pb-h">The problem</h2>
        <p>${esc(p.problem)}</p>
      </section>

      <section aria-labelledby="how-h">
        <h2 id="how-h">How I did it</h2>
        <ol class="steps">
${p.steps.map((s) => `          <li>${esc(s)}</li>`).join('\n')}
        </ol>${p.note ? `
        <p class="callout">${ico('i-key')}<span><b>${p.note[0]}.</b> ${esc(p.note[1])}</span></p>` : ''}
      </section>

      <section aria-labelledby="res-h">
        <h2 id="res-h">Result</h2>
        <p>${esc(p.result)}</p>
      </section>
    </article>
  </div>

  <nav class="pager wrap" aria-label="More projects">
    <a href="../${prev.slug}/"><small>${ico('i-back')}Previous</small><b>${esc(prev.title)}</b></a>
    <a href="../${next.slug}/"><small>Next${ico('i-arrow')}</small><b>${esc(next.title)}</b></a>
  </nav>
`;
  return page({ R, active: 'projects', title: `${p.title}: Ivan Vasilev`, desc: p.lead, body });
}

/* ---------- Experience ---------- */
function experience() {
  const R = '../';
  const labs = PROJECTS.filter((p) => p.where === 'Lab');
  const jobs = JOBS.map((j) => `      <li class="job${j.now ? ' job-now' : ''}">
        <div class="job-side">
          <span class="when">${j.when}</span>
          <span class="place">${j.place}</span>
        </div>
        <div class="job-main">
          <h2>${esc(j.company)}</h2>
          <p class="pos">${esc(j.role)}</p>
          <p class="sum">${esc(j.summary)}</p>
          <ul class="duties">
${j.duties.map((d) => `            <li>${esc(d)}</li>`).join('\n')}
          </ul>${j.projects.length ? `
          <div class="tags" aria-label="Projects at ${esc(j.company)}">
            ${j.projects.map((s) => projTag(R, bySlug[s])).join('\n            ')}
          </div>` : ''}
        </div>
      </li>`).join('\n');
  const body = pageHead('Experience', 'Four roles since 2021, from automotive hardware to site reliability. Projects link to how I built them.', `
    <ul class="facts">
      <li><b>5M+</b> documents on a new shard</li>
      <li><b>2,500 qps</b> split across two shards</li>
    </ul>`) + `
  <section class="wrap page-body" aria-label="Roles">
    <ol class="jobs">
${jobs}
      <li class="job job-lab">
        <div class="job-side">
          <span class="when">Ongoing</span>
          <span class="place">At home</span>
        </div>
        <div class="job-main">
          <h2>Home lab</h2>
          <p class="pos">Personal projects</p>
          <p class="sum">Where I try new tools before I trust them at work.</p>
          <div class="tags" aria-label="Home lab projects">
            ${labs.map((p) => projTag(R, p)).join('\n            ')}
          </div>
        </div>
      </li>
    </ol>
  </section>
`;
  return page({ R, active: 'experience', title: 'Experience: Ivan Vasilev', desc: 'Site Reliability Engineer II at PROS, system administrator at Radioactive and Helpdesk Bulgaria, and R&D hardware engineer at Behr-Hella Thermocontrol.', body });
}

/* ---------- Education ---------- */
function education() {
  const R = '../';
  const body = pageHead('Education and training', 'School, certificates and what I am studying right now.') + `
  <section class="wrap page-body edu" aria-labelledby="cert-h">
    <div class="edu-main">
      <h2 id="cert-h">Certificates</h2>
      <ul class="certs">
${CERTS.map(([ic, n, f]) => {
  const pdf = `${R}assets/certs/${f}.pdf`, pages = PREVIEWS[f].pages.length;
  return `        <li>${chip(R, ic)}<span class="cert-name">${n}${pages > 1 ? `<small>${pages} pages</small>` : ''}</span><a class="pill-link cert-open" href="${pdf}" target="_blank" rel="noopener" data-cert="${f}" aria-haspopup="dialog">${ico('i-eye')}View<span class="sr"> the ${n} certificate</span></a><a class="cert-dl" href="${pdf}" download="Ivan-Vasilev-${f}.pdf" type="application/pdf" aria-label="Download the ${n} PDF" title="Download PDF">${ico('i-download')}</a></li>`;
}).join('\n')}
      </ul>
      <script type="application/json" id="cert-data">${JSON.stringify(Object.fromEntries(CERTS.map(([, n, f]) => [f, { title: n, pdf: `${R}assets/certs/${f}.pdf`, file: `Ivan-Vasilev-${f}.pdf`, pages: PREVIEWS[f].pages.map(([w, h], i) => [`${R}assets/certs/preview/${f}-${i + 1}.webp`, w, h]) }])))}</script>
      <dialog class="cert-dlg" aria-labelledby="dlg-h">
        <div class="dlg-head">
          <div><h2 id="dlg-h"></h2><p class="dlg-sub"></p></div>
          <div class="dlg-act">
            <a class="theme-btn dlg-tab" href="#" target="_blank" rel="noopener" aria-label="Open the PDF in a new tab" title="Open in new tab">${ico('i-ext')}</a>
            <a class="theme-btn dlg-dl" href="#" download type="application/pdf" aria-label="Download the PDF" title="Download PDF">${ico('i-download')}</a>
            <button class="theme-btn dlg-x" type="button" aria-label="Close preview" title="Close">${ico('i-x')}</button>
          </div>
        </div>
        <div class="dlg-body" tabindex="0"></div>
      </dialog>
    </div>

    <div class="side">
      <div class="side-block">
        <h2>School</h2>
        <ul>
          <li>${ico('i-landmark')}<span>Technical University of Sofia <small>Two years of study</small></span></li>
          <li>${ico('i-landmark')}<span>TUES, electronic systems <small>Technology school with TU Sofia</small></span></li>
        </ul>
      </div>
      <div class="side-block">
        <h2>Languages</h2>
        <ul>
          <li>${ico('i-chat')}<span>Bulgarian <small>Native</small></span></li>
          <li>${ico('i-chat')}<span>English <small>Professional</small></span></li>
        </ul>
      </div>
      <div class="side-block">
        <h2>Currently focused on</h2>
        <ul class="learn">
          <li>${chip(R, 'aws')}<span>AWS architecture <small>Taking Architecting on AWS further, from the course to real designs</small></span></li>
          <li>${chip(R, '#i-settings')}<span>Kubernetes <small>From the basics up, in my home lab</small></span></li>
        </ul>
      </div>
    </div>
  </section>
`;
  return page({ R, active: 'education', title: 'Education and training: Ivan Vasilev', desc: 'AWS, Fortinet and Cisco training, studies at TU Sofia and TUES, and what Ivan Vasilev is learning now.', body });
}

/* ---------- Write ---------- */
function write(rel, html) {
  const f = join(OUT, rel);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, html);
  console.log('wrote', rel);
}
write('index.html', about());
write('projects/index.html', projectsIndex());
PROJECTS.forEach((p, i) => write(`projects/${p.slug}/index.html`, projectPage(p, i)));
write('experience/index.html', experience());
write('education/index.html', education());
