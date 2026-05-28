# Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit using conventional commits (`feat:`, `fix:`, `chore:`, etc.)
4. Push and open a PR

## Development

```bash
bun install
bun run dev      # Run in dev mode
bun test         # Run tests
bun run lint     # Lint with Biome
```

## Guidelines

- Keep files small (target 200 lines, max 400)
- All code is TypeScript strict — no `any`, use `unknown` + zod
- Every scanner must have a unit test
- Follow the seven hard product principles from SPEC.md
