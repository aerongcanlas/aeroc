<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Do

- After making changes, summarize what changed, but skip build and test verification by default.
- If verification seems important for risky changes, ask before running it.

## Don't

- Don't run or ask to run `npm run build`, `pnpm build`, `yarn build`, or other full build commands unless I explicitly ask.
- Don't use divs or any JSX intrinsic elements if there are existing components in `spa/src/components`.

## Project Structure

- components are in `spa/src/components`.
