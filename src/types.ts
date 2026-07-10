/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Comment {
  id: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface Addon {
  id: string;
  name: string;
  description: string;
  category: string;
  compatibleVersion: string;
  coverUrl: string;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  downloads: number;
  comments: Comment[];
  createdAt: string;
  author: string;
}
