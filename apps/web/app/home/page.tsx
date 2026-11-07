import HomePage, { metadata as homeMetadata } from "../page"

/**
 * The marketing homepage for someone who is signed in. For them `/` is the dashboard (see
 * lib/zones.ts), so the dashboard's account menu links here. Search engines get `/` as its canonical.
 */
export const metadata = homeMetadata

export default HomePage
