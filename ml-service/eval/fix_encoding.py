import pathlib

scripts = [
    'eval/part1_model_comparison.py',
    'eval/part3_conformal.py',
    'eval/part4_noise_robustness.py',
    'eval/part5_shap_analysis.py',
]

insert_after = 'warnings.filterwarnings("ignore")\n'
line1 = 'import io\n'
line2 = 'sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")\n'
line3 = 'sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")\n'
to_insert = line1 + line2 + line3

for s in scripts:
    p = pathlib.Path(s)
    content = p.read_text(encoding='utf-8')
    content = content.replace(chr(0x2192), '->')
    content = content.replace(chr(0x2500), '-')
    if 'sys.stdout = io.TextIOWrapper' not in content and insert_after in content:
        content = content.replace(insert_after, insert_after + to_insert, 1)
    p.write_text(content, encoding='utf-8')
    print('Fixed:', s)
