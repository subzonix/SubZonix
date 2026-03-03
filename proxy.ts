import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of known AI bot user-agent substrings
const AI_BOTS = [
    'gptbot',
    'chatgpt-user',
    'claudebot',
    'claude-web',
    'google-extended',
    'perplexitybot',
    'youbot',
    'bytespider',
    'ccbot',
    'diffbot',
    'imagesiftbot',
    'omegabot',
    'meta-externalagent',
    'anthropic-ai',
    'timpibot',
    'cohere-ai',
    'facebookexternalhit', // Often used by meta AI
    'lovable',
    'cursor',
    'v0-bot',
    'bolt-bot',
    'trae',
    'replit',
    'applebot-extended',
    'oai-searchbot',
    'webcopy',
    'dotbot',
    'petalbot',
];

export function proxy(request: NextRequest) {
    const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';

    // Check if the user agent matches any known AI bot
    const isBot = AI_BOTS.some(bot => userAgent.includes(bot));

    if (isBot) {
        console.log(`[Security] Blocked AI Bot: ${userAgent}`);
        return new NextResponse(
            JSON.stringify({ error: 'Access denied: AI crawlers and scrapers are not permitted on this site.' }),
            { status: 403, headers: { 'content-type': 'application/json' } }
        );
    }

    return NextResponse.next();
}

// Apply to all routes
export const config = {
    matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
