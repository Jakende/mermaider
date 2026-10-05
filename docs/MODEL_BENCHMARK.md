# Repeated bilingual model checks

The harness uses six authored German/English choice cases, each with state A → B → A,
repeated three times by default: 54 real requests when a provider is available.
It never invents responses or switches providers after a failure.

```bash
npm run benchmark:decisions -- --dry-run
npm run benchmark:decisions -- --provider laya --endpoint http://127.0.0.1:8000 --model multilingual
```

The dry run validates planned inputs without inference. Set up Laya with
[these instructions](LAYA_SETUP.md) before the second command.

For Jev, enter the existing personal key locally without putting it in shell history:

```bash
read -rs MERMAIDER_JEV_API_KEY
export MERMAIDER_JEV_API_KEY
npm run benchmark:decisions -- --provider jev --model jev-latest
unset MERMAIDER_JEV_API_KEY
```

Windows PowerShell:

```powershell
$secret = Read-Host 'Jev API key' -AsSecureString
$env:MERMAIDER_JEV_API_KEY = [Net.NetworkCredential]::new('', $secret).Password
npm run benchmark:decisions -- --provider jev --model jev-latest
Remove-Item Env:MERMAIDER_JEV_API_KEY
```

Use the provider's available model name if it differs. `--repetitions` accepts 1–20;
`--output` selects the result filename (default `decision-benchmark.json`, ignored
by git). Keys come only from process environment and are not exported.

The report separates successful-choice accuracy, binary Brier score, A/B/A agreement,
request errors, median/p95 successful-request latency and returned model names.
Inspect errors alongside accuracy: failed requests are excluded from accuracy and
the latency summary but remain in the individual results. Agreement is calculated
only for complete successful triples. Provider failures are sanitized.

These are small correlated authored cases, not independent population samples.
They cannot establish calibrated confidence, operating thresholds or a general
reliability guarantee. Score/noul contracts have unit tests, but this particular
model-quality harness covers choice; their real quality still needs dedicated
provider/device acceptance. No new real benchmark is claimed until it is run.
