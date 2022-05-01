/**
 * https://www.jsonfeed.org/version/1.1/
 */
export interface JSONFeed {
    version: string;
    title: string;
    home_page_url?: string;
    feed_url?: string;
    description?: string;
    user_comment?: string;
    next_url?: string;
    icon?: string;
    favicon?: string;
    authors?: JSONFeedAuthor[];
    language?: string;
    expired?: boolean;
    hubs?: JSONHub[];
    items: JSONFeedItem[];
}
export interface JSONFeedAuthor {
    name?: string;
    url?: string;
    avatar?: string;
}
export interface JSONHub {
    type: string;
    url: string;
}
export interface JSONFeedItem {
    id: string;
    url?: string;
    external_url?: string;
    title?: string;
    content_html?: string;
    content_text?: string;
    summary?: string;
    image?: string;
    banner_image?: string;
    date_published?: string;
    date_modified?: string;
    authors?: JSONFeedAuthor[];
    tags?: string[];
    language?: string;
    attachments?: JSONFeedAttachment[];
    // custom fields (must start with _)
    _views?: number;
    _threadId?: string;
}
/**
 * @param mime_type - The mime type of the attachment. 
 * e.g. image/jpeg, audio/mpeg, video/mp4
 */
 export interface JSONFeedAttachment {
    url: string;
    mime_type: string;
    title?: string;
    size_in_bytes?: number;
    duration_in_seconds?: number;
}