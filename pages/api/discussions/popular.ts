import type { NextApiRequest, NextApiResponse } from "next";

export interface DiscussionTopic {
  tid: number;
  uid: number;
  cid: number;
  title: string;
  slug: string;
  mainPid: number;
  postcount: number;
  viewcount: number;
  postercount: number;
  scheduled: number;
  deleted: number;
  deleterUid: number;
  titleRaw: string;
  timestamp: number;
  lastposttime: number;
  lastposteruid: number;
  lastposter: string;
  teaserPid: number;
  tags: any[];
  isOwner: boolean;
  ignored: boolean;
  unread: boolean;
  bookmark: any;
  unreplied: boolean;
  icons: any[];
  index: number;
  user: {
    uid: number;
    username: string;
    displayname: string;
    fullname: string;
    userslug: string;
    reputation: number;
    postcount: number;
    topiccount: number;
    picture: any;
    signature: any;
    banned: number;
    status: string;
    lastonline: number;
    groupTitle: string;
    groupTitleArray: any[];
    icon: {
      text: string;
      bgColor: string;
    };
    selectedGroups: any[];
  };
  category: {
    cid: number;
    name: string;
    slug: string;
    icon: string;
    imageClass: string;
    bgColor: string;
    color: string;
    disabled: number;
  };
  teaser: {
    pid: number;
    uid: number;
    timestamp: number;
    tid: number;
    content: string;
    timestampISO: string;
    user: {
      uid: number;
      username: string;
      displayname: string;
      userslug: string;
      picture: any;
      icon: {
        text: string;
        bgColor: string;
      };
      status: string;
      reputation: number;
    };
    index: number;
    deleted: number;
    edited: number;
  };
  timestampISO: string;
  lastposttimeISO: string;
}

interface DiscussionForumApiResponse {
  topics: DiscussionTopic[];
  nextStart: number;
  topicCount: number;
}

// Dynamic URL function for server-side
const getDiscussionForumUrl = (req: NextApiRequest): string => {
  const host = req.headers.host;
  // Check if running on localhost or dev environment
  if (
    host?.includes("localhost") ||
    host?.includes("dev") ||
    process.env.NODE_ENV === "development"
  ) {
    return "/discussion-forum/api/popular";
  }
  return "/discussion-forum/api/popular";
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const discussionApiUrl = getDiscussionForumUrl(req);
    const response = await fetch(discussionApiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: DiscussionForumApiResponse = await response.json();

    if (data.topics && Array.isArray(data.topics)) {
      // Limit to 20 discussions
      const limitedTopics = data.topics.slice(0, 20);

      res.status(200).json({
        success: true,
        data: limitedTopics,
        status: response.status,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Invalid response format from discussion forum API",
        status: response.status,
      });
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch discussions",
      status: 0,
    });
  }
}
