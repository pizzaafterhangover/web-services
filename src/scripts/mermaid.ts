// ```mermaid 코드블록이 있는 페이지에서만 mermaid를 불러와 그린다.
const blocks = [...document.querySelectorAll<HTMLElement>('code.language-mermaid')].map((code) => code.parentElement!);

if (blocks.length > 0) {
  for (const block of blocks) {
    block.dataset.source = block.textContent ?? '';
    block.classList.add('mermaid');
    block.setAttribute('aria-busy', 'true');
  }

  const { default: mermaid } = await import('mermaid');

  const isDark = () => {
    const theme = document.documentElement.dataset.theme;
    return theme ? theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const draw = async () => {
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark() ? 'dark' : 'neutral',
      fontFamily: getComputedStyle(document.body).fontFamily,
    });
    for (const [i, block] of blocks.entries()) {
      try {
        const { svg } = await mermaid.render(`mermaid-${i}-${Date.now()}`, block.dataset.source!);
        block.innerHTML = svg;
        block.dataset.processed = 'true';
      } catch (error) {
        block.textContent = `다이어그램을 그리지 못했습니다: ${(error as Error).message}`;
        block.dataset.error = 'true';
      }
      block.removeAttribute('aria-busy');
    }
  };

  await draw();
  document.addEventListener('themechange', draw);
}
