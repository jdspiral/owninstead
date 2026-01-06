# Session Context
Last saved: 2026-01-06 08:52 PST

## Current Task
Setting up context persistence for Claude Code sessions and testing the OwnInstead mobile app with Plaid/SnapTrade integrations.

## Key Decisions Made
- Fixed Node.js version issue: `.xcode.env.local` now uses Node 20 (required for `toReversed()` method in metro-config)
- Fixed settings.tsx crash: Added optional chaining for `plaidInstitutions?.length`
- Plaid sandbox testing: Use "First Platypus Bank" with `user_good` / `pass_good`
- SnapTrade testing: Use "Alpaca Paper" brokerage
- Context persistence: Using skills + hooks approach (not commands)

## Important Context
- **Render backend**: Has `PLAID_ENV=development` which causes DNS errors (`development.plaid.com` doesn't exist). Needs to be changed to `sandbox` in Render dashboard.
- Mobile app is running Release build on physical iPhone (not hot-reloadable)
- CocoaPods PATH issue was fixed by adding `/opt/homebrew/lib/ruby/gems/3.4.0/bin` to PATH

## Files Being Modified
- `/Users/josh/dev/owninstead/apps/mobile/ios/.xcode.env.local` - Node version fix
- `/Users/josh/dev/owninstead/apps/mobile/app/(tabs)/settings.tsx` - null safety fix
- `/Users/josh/dev/owninstead/.claude/settings.local.json` - Added SessionStart hook
- `/Users/josh/dev/owninstead/.claude/skills/save-context.md` - Created
- `/Users/josh/dev/owninstead/.claude/hooks/restore-context.sh` - Created

## Next Steps
- [ ] Change Render `PLAID_ENV` from `development` to `sandbox`
- [ ] Test full app flow: create rule, trigger evaluation, execute order
- [ ] Test context restoration after compaction
