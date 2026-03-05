/**
 * Tool Logo Domain Mapper
 * Maps tool/service name keywords → their official website domain.
 * The ToolLogo component will try multiple logo CDNs using this domain.
 *
 * CDN Priority (tried in order):
 *  1. https://logo.clearbit.com/{domain}          — high-res brand logos
 *  2. https://img.logo.dev/{domain}?token=pk_...   — Logo.dev (very broad coverage)
 *  3. https://www.google.com/s2/favicons?domain={domain}&sz=128  — Google favicon fallback
 */

const TOOL_DOMAIN_MAP: Record<string, string> = {
    // ─── Streaming ───────────────────────────────────────────────
    netflix: "netflix.com",
    spotify: "spotify.com",
    youtube: "youtube.com",
    "youtube premium": "youtube.com",
    prime: "amazon.com",
    "amazon prime": "amazon.com",
    amazon: "amazon.com",
    "disney+": "disneyplus.com",
    disney: "disneyplus.com",
    hulu: "hulu.com",
    hbo: "max.com",
    max: "max.com",
    "hbo max": "max.com",
    crunchyroll: "crunchyroll.com",
    "paramount+": "paramountplus.com",
    paramount: "paramountplus.com",
    peacock: "peacocktv.com",
    "apple tv": "tv.apple.com",
    appletv: "tv.apple.com",
    showtime: "showtime.com",
    starz: "starz.com",
    vudu: "vudu.com",
    funimation: "funimation.com",
    shahid: "shahid.net",
    osn: "osn.com",
    bein: "beinsports.com",
    "bein sports": "beinsports.com",
    zee5: "zee5.com",
    hotstar: "hotstar.com",
    voot: "voot.com",
    eros: "erosnow.com",
    mubi: "mubi.com",
    discovery: "discoveryplus.com",
    "discovery+": "discoveryplus.com",

    // ─── Music ───────────────────────────────────────────────────
    deezer: "deezer.com",
    tidal: "tidal.com",
    soundcloud: "soundcloud.com",
    "apple music": "music.apple.com",
    applemusic: "music.apple.com",
    pandora: "pandora.com",
    audiomack: "audiomack.com",

    // ─── AI & Productivity ────────────────────────────────────────
    chatgpt: "openai.com",
    openai: "openai.com",
    "chat gpt": "openai.com",
    claude: "anthropic.com",
    anthropic: "anthropic.com",
    gemini: "gemini.google.com",
    "google gemini": "gemini.google.com",
    copilot: "copilot.microsoft.com",
    "microsoft copilot": "microsoft.com",
    midjourney: "midjourney.com",
    "stable diffusion": "stability.ai",
    stability: "stability.ai",
    runway: "runwayml.com",
    pika: "pika.art",
    perplexity: "perplexity.ai",
    jasper: "jasper.ai",
    writesonic: "writesonic.com",
    grammarly: "grammarly.com",
    notion: "notion.so",
    otter: "otter.ai",
    fireflies: "fireflies.ai",
    elevenlabs: "elevenlabs.io",
    "eleven labs": "elevenlabs.io",
    synthesia: "synthesia.io",
    tome: "tome.app",
    gamma: "gamma.app",
    beautiful: "beautiful.ai",
    "heygen": "heygen.com",

    // ─── Design & Creative ────────────────────────────────────────
    canva: "canva.com",
    adobe: "adobe.com",
    "adobe creative cloud": "adobe.com",
    "creative cloud": "adobe.com",
    photoshop: "adobe.com",
    illustrator: "adobe.com",
    lightroom: "adobe.com",
    "after effects": "adobe.com",
    premiere: "adobe.com",
    figma: "figma.com",
    sketch: "sketch.com",
    capcut: "capcut.com",
    "cap cut": "capcut.com",
    invideo: "invideo.ai",
    "in video": "invideo.ai",
    envato: "envato.com",
    "envato elements": "elements.envato.com",
    elements: "elements.envato.com",
    storyblocks: "storyblocks.com",
    shutterstock: "shutterstock.com",
    istock: "istockphoto.com",
    "getty images": "gettyimages.com",
    gettyimages: "gettyimages.com",
    "123rf": "123rf.com",
    unsplash: "unsplash.com",
    pexels: "pexels.com",
    freepik: "freepik.com",
    flaticon: "flaticon.com",

    // ─── Social & Communication ───────────────────────────────────
    instagram: "instagram.com",
    tiktok: "tiktok.com",
    twitter: "twitter.com",
    x: "x.com",
    linkedin: "linkedin.com",
    facebook: "facebook.com",
    snapchat: "snapchat.com",
    discord: "discord.com",
    whatsapp: "whatsapp.com",
    telegram: "telegram.org",
    pinterest: "pinterest.com",
    reddit: "reddit.com",
    threads: "threads.net",
    bereal: "bereal.com",
    clubhouse: "clubhouse.com",

    // ─── Developer & Cloud Tools ──────────────────────────────────
    github: "github.com",
    gitlab: "gitlab.com",
    jira: "atlassian.com",
    confluence: "atlassian.com",
    slack: "slack.com",
    zoom: "zoom.us",
    teams: "microsoft.com",
    "microsoft teams": "microsoft.com",
    webex: "webex.com",
    "google meet": "meet.google.com",
    loom: "loom.com",
    clickup: "clickup.com",
    asana: "asana.com",
    monday: "monday.com",
    trello: "trello.com",
    airtable: "airtable.com",
    notion2: "notion.so",
    basecamp: "basecamp.com",
    linear: "linear.app",

    // ─── Business & Office ────────────────────────────────────────
    microsoft: "microsoft.com",
    office: "microsoft.com",
    "office 365": "microsoft.com",
    office365: "microsoft.com",
    "microsoft 365": "microsoft.com",
    word: "microsoft.com",
    excel: "microsoft.com",
    powerpoint: "microsoft.com",
    onedrive: "microsoft.com",
    google: "google.com",
    "google workspace": "workspace.google.com",
    "google drive": "drive.google.com",
    "g suite": "workspace.google.com",
    gsuite: "workspace.google.com",
    dropbox: "dropbox.com",
    box: "box.com",
    hubspot: "hubspot.com",
    salesforce: "salesforce.com",
    zendesk: "zendesk.com",
    freshdesk: "freshdesk.com",
    mailchimp: "mailchimp.com",
    pipedrive: "pipedrive.com",
    activecampaign: "activecampaign.com",

    // ─── VPN & Security ───────────────────────────────────────────
    nordvpn: "nordvpn.com",
    expressvpn: "expressvpn.com",
    surfshark: "surfshark.com",
    cyberghost: "cyberghost.com",
    proton: "proton.me",
    "proton vpn": "protonvpn.com",
    protonvpn: "protonvpn.com",
    ipvanish: "ipvanish.com",
    purevpn: "purevpn.com",
    "private internet access": "privateinternetaccess.com",
    pia: "privateinternetaccess.com",
    "1password": "1password.com",
    lastpass: "lastpass.com",
    bitwarden: "bitwarden.com",
    dashlane: "dashlane.com",
    keeper: "keepersecurity.com",

    // ─── Education ────────────────────────────────────────────────
    duolingo: "duolingo.com",
    coursera: "coursera.org",
    udemy: "udemy.com",
    skillshare: "skillshare.com",
    masterclass: "masterclass.com",
    chegg: "chegg.com",
    linkedin_learning: "linkedin.com",
    "linkedin learning": "linkedin.com",
    pluralsight: "pluralsight.com",
    datacamp: "datacamp.com",
    edx: "edx.org",
    babbel: "babbel.com",
    rosettastone: "rosettastone.com",

    // ─── Gaming ───────────────────────────────────────────────────
    playstation: "playstation.com",
    "ps plus": "playstation.com",
    "playstation plus": "playstation.com",
    xbox: "xbox.com",
    "xbox game pass": "xbox.com",
    "game pass": "xbox.com",
    nintendo: "nintendo.com",
    steam: "steampowered.com",
    roblox: "roblox.com",
    "ea play": "ea.com",
    ea: "ea.com",
    ubisoft: "ubisoft.com",
    "epic games": "epicgames.com",
    epic: "epicgames.com",
    gog: "gog.com",
    "humble bundle": "humblebundle.com",

    // ─── Apple ────────────────────────────────────────────────────
    apple: "apple.com",
    "apple one": "apple.com",
    "icloud+": "icloud.com",
    icloud: "icloud.com",
    "apple arcade": "apple.com",
    "apple fitness": "apple.com",

    // ─── Storage & Utility ────────────────────────────────────────
    "google one": "one.google.com",
    googleone: "one.google.com",
    pcloud: "pcloud.com",
    mega: "mega.io",
    backblaze: "backblaze.com",
    acronis: "acronis.com",
    "idrive": "idrive.com",

    // ─── Analytics & Marketing ────────────────────────────────────
    semrush: "semrush.com",
    ahrefs: "ahrefs.com",
    moz: "moz.com",
    screaming: "screamingfrog.co.uk",
    hootsuite: "hootsuite.com",
    buffer: "buffer.com",
    sprout: "sproutsocial.com",
    tapntools: "tapntools.com",
    subzonix: "subzonix.com",
};

/**
 * Get the domain associated with a given tool name.
 * Uses case-insensitive, keyword matching (partial match supported).
 */
export function getToolDomain(toolName: string): string | null {
    if (!toolName) return null;

    const lower = toolName.toLowerCase().trim();

    // Exact match first
    if (TOOL_DOMAIN_MAP[lower]) return TOOL_DOMAIN_MAP[lower];

    // Check if any key is substring of the tool name (e.g. "Netflix 4K" → "netflix")
    for (const [key, domain] of Object.entries(TOOL_DOMAIN_MAP)) {
        if (lower.includes(key)) return domain;
    }

    // Check if tool name is substring of any key (e.g. "prime" matches "amazon prime")
    for (const [key, domain] of Object.entries(TOOL_DOMAIN_MAP)) {
        if (key.includes(lower) && lower.length >= 3) return domain;
    }

    return null;
}

/**
 * Get an ordered list of logo URLs to try for a given domain.
 * ToolLogo component will try these in order, falling back on error.
 */
export function getLogoSources(domain: string): string[] {
    return [
        `https://logo.clearbit.com/${domain}`,
        `https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6BeQ`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    ];
}
