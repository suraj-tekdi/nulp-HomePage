import type { NextApiRequest, NextApiResponse } from "next";

export interface DomainDiscussionPost {
  pid: number;
  tid: number;
  content: string;
  uid: number;
  timestamp: number;
  deleted: boolean;
  upvotes: number;
  downvotes: number;
  replies: number;
  votes: number;
  timestampISO: string;
  user: {
    uid: number;
    username: string;
    userslug: string;
    picture: string | null;
    status: string;
    fullname: string;
    displayname: string;
    user_id: string | null;
    designation?: string;
    location?: string;
  };
  topic: {
    uid: number;
    tid: number;
    title: string;
    cid: number;
    tags: any[];
    slug: string;
    deleted: number;
    scheduled: boolean;
    postcount: number;
    mainPid: number;
    teaserPid: number;
    timestamp: number;
    titleRaw: string;
    timestampISO: string;
    isQuestion: number;
    isSolved: number;
  };
  category: {
    cid: number;
    name: string;
    icon: string;
    slug: string;
    parentCid: number;
    bgColor: string;
    color: string;
    backgroundImage?: string;
    imageClass?: string;
  };
  isMainPost: boolean;
}

interface DomainDiscussionsApiResponse {
  ts: string;
  params: {
    resmsgid: string;
    msgid: string;
    status: string;
  };
  responseCode: string;
  result: {
    domainName: string;
    totalPosts: number;
    posts: DomainDiscussionPost[];
  };
}

// Dynamic URL function for server-side
const getDiscussionByDomainUrl = (req: NextApiRequest): string => {
  const host = req.headers.host;
  // Check if running on localhost or dev environment
  if (
    host?.includes("localhost") ||
    host?.includes("dev") ||
    process.env.NODE_ENV === "development"
  ) {
    return "/discussion/api/posts/by-domain";
  }
  return "/discussion/api/posts/by-domain";
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

  const { domainName } = req.query;

  if (!domainName || typeof domainName !== "string") {
    return res.status(400).json({
      success: false,
      error: "Domain name is required",
    });
  }

  try {
    const encodedDomain = encodeURIComponent(domainName);
    const discussionApiUrl = getDiscussionByDomainUrl(req);
    const response = await fetch(
      `${discussionApiUrl}?domainName=${encodedDomain}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      // Handle 404 as "no data available" rather than an error
      if (response.status === 404) {
        return res.status(200).json({
          success: true,
          data: [],
          status: response.status,
          isEmpty: true,
          domainName: domainName,
        });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: DomainDiscussionsApiResponse = await response.json();

    if (data.responseCode === "OK") {
      // Handle case where posts array exists but might be empty
      const posts = data.result?.posts || [];

      // Filter to only include main posts (original posts, not replies)
      const mainPosts = posts.filter((post) => post.isMainPost);

      // Limit to 20 discussions for consistency
      const limitedPosts = mainPosts.slice(0, 20);

      res.status(200).json({
        success: true,
        data: limitedPosts,
        status: response.status,
        isEmpty: limitedPosts.length === 0,
        domainName: data.result?.domainName || domainName,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Invalid response format from discussion forum API",
        status: response.status,
      });
    }
  } catch (error) {
    console.error("Domain Discussions API Error:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch discussions by domain",
      status: 0,
    });
  }
}
