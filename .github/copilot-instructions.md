# Tempermonkey Scripts Repository

This repository contains Chinese Tampermonkey userscripts for Bilibili live streaming platform. These are browser userscripts that enhance Bilibili's functionality for Chinese users.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Initial Setup
- Clone the repository - **NO additional setup needed** for basic script development
- **OPTIONAL**: For enhanced development tooling (linting only):
  - `npm install` - installs ESLint for code quality checking
  - Takes 10-15 seconds. NEVER CANCEL.
  - **NOTE**: Development files (package.json, eslint.config.js) are git-ignored and should NOT be committed

### Code Validation
**Basic validation (always available):**
- `node --check Bilibili/[script-name].user.js` - validates individual script syntax

**Enhanced validation (after npm install):**
- `npm run syntax-check` - validates all scripts (under 5 seconds, NEVER CANCEL)
- `npm run lint` - checks code quality (under 5 seconds, NEVER CANCEL)

**ALWAYS validate syntax before committing changes.**

### Understanding the Repository Structure
- **NO BUILD SYSTEM**: Scripts are used directly as `.user.js` files
- **NO TESTING FRAMEWORK**: Manual browser testing only
- **NO CI/CD**: Simple repository with no automated validation
- All scripts are in `/Bilibili/` directory
- Each script targets specific Bilibili URLs (live streaming pages)

## Validation

### Script Installation Testing
Since these are Tampermonkey userscripts, you CANNOT run them directly in Node.js. To validate functionality:

1. **Syntax Validation** (automated): `npm run syntax-check`
2. **Code Quality** (automated): `npm run lint`  
3. **Functional Testing** (manual only): Install script in browser with Tampermonkey extension

### Manual Browser Testing Requirements
For any functional changes to scripts:
- Install Tampermonkey browser extension
- Load the modified `.user.js` file 
- Navigate to target Bilibili page (typically live.bilibili.com/[room-number])
- Verify the script enhancement works correctly
- **YOU CANNOT AUTOMATE THIS** - browser testing is required for functional validation

### Pre-commit Validation
**Basic (always available):**
- Manually check each changed script: `node --check Bilibili/[filename].user.js`

**Enhanced (if npm install was run):**
- `npm run syntax-check` - verifies all JavaScript syntax (under 5 seconds)
- `npm run lint` - checks code quality (under 5 seconds)

## Repository Structure

### Script Organization
```
/Bilibili/
├── B站动态自定义过滤.user.js           (Dynamic filtering)
├── B站直播间添加个人主页连结到用户名.user.js   (Add profile links) 
├── B站直播间自定义覆盖.user.js          (Custom overlays)
├── B站直播随看随录.user.js             (Live recording tool)
├── 封禁直播间点亮牌子.user.js           (Medal lighting ban)
├── 斗虫数据直播间可视化.user.js         (Data visualization)
├── 高亮个别用户的弹幕.user.js           (Highlight user comments)
└── 高能榜显示总人数.user.js            (High energy list total)
```

### Key Script Features
- **高亮个别用户的弹幕.user.js**: Has settings pages at eric2788.github.io and eric2788.neeemooo.com
- All scripts target Bilibili live streaming pages: `live.bilibili.com/(blanc/)?[room-id]`
- Scripts use jQuery and other CDN libraries via `@require` directives

## Technology Stack

### Dependencies (CDN-based)
All dependencies are loaded via CDN in userscript headers:
- **jQuery 3.5.1**: `https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js`
- **Brotli decode**: `https://cdn.jsdelivr.net/gh/google/brotli@.../js/decode.js`
- **MD5**: `https://cdn.jsdelivr.net/npm/js-md5@0.7.3/build/md5.min.js`
- **Toastr**: `https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/toastr.js/2.1.4/toastr.min.js`
- **Custom libraries**: bliveproxy for Bilibili API integration

### Userscript Headers
Each script includes standard Tampermonkey metadata:
```javascript
// ==UserScript==
// @name         [Script Name]
// @namespace    http://tampermonkey.net/
// @version      [Version]
// @description  [Description]
// @author       Eric Lam
// @include      [Target URLs - typically Bilibili live pages]
// @require      [CDN dependencies]
// @grant        [Tampermonkey permissions]
// ==/UserScript==
```

## Common Development Tasks

### Adding New Scripts
1. Create new `.user.js` file in `/Bilibili/` directory
2. Add proper userscript header with metadata
3. Include necessary `@require` directives for dependencies
4. Set appropriate `@include` patterns for target URLs
5. Validate syntax: `npm run syntax-check`
6. Test linting: `npm run lint`

### Modifying Existing Scripts
1. Edit the `.user.js` file directly
2. Maintain existing userscript header format
3. **NEVER** change `@include` URLs without understanding impact
4. **NEVER** remove `@require` dependencies without checking usage
5. Always run `npm run syntax-check && npm run lint` before committing

### Understanding Script Patterns
- Most scripts use jQuery for DOM manipulation
- Scripts observe DOM mutations to detect new content
- Many scripts store settings using `GM_setValue`/`GM_getValue`
- Bilibili API calls use `GM.xmlHttpRequest` for CORS bypass
- Scripts typically target live streaming interface elements

## Troubleshooting

### Common Issues
- **Syntax errors**: Run `npm run syntax-check` to identify
- **Linting issues**: Run `npm run lint` to see code quality problems
- **Functional issues**: Must test manually in browser with Tampermonkey
- **Dependency issues**: Check `@require` URLs are accessible

### Development Environment
- **Node.js**: Available for syntax checking only
- **ESLint**: Available for code quality checking  
- **NO browser automation**: Cannot test userscript functionality programmatically
- **NO package manager dependencies**: All deps via CDN

### Validation Commands Reference
```bash
# Basic syntax checking (always available)
node --check Bilibili/[filename].user.js

# Enhanced commands (after npm install)
npm run syntax-check  # Check all scripts (under 5 seconds, NEVER CANCEL)
npm run lint          # Check code quality (under 5 seconds, NEVER CANCEL)  
npm install           # Install development tools (optional, 15 seconds)
```

## Important Notes

- **NO BUILD PROCESS**: Scripts are used directly, no compilation needed
- **MANUAL TESTING REQUIRED**: Functional validation must be done in browser
- **CDN DEPENDENCIES**: No npm packages, everything loaded via @require  
- **CHINESE CONTENT**: All scripts and comments are in Chinese
- **BILIBILI SPECIFIC**: All scripts target Bilibili platform features
- Repository language is primarily Chinese with technical terms in English