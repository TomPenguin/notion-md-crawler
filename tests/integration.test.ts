import { beforeAll, describe, expect, it } from "vitest";
import { Client } from "@notionhq/client";
import { config } from "dotenv";
import { crawler } from "../src/index.js";

// Load environment variables from .env file
config();

/**
 * Manual integration test to verify the crawler functionality with @notionhq/client 4.0.0
 * 
 * This test is skipped by default and requires manual execution with valid credentials.
 * 
 * Usage:
 * 1. Create .env file with:
 *    - NOTION_API_TOKEN=your_token
 *    - NOTION_TEST_PAGE_ID=your_page_id
 * 2. Run: pnpm run test:integration
 */

const NOTION_API_TOKEN = process.env.NOTION_API_TOKEN;
const NOTION_TEST_PAGE_ID = process.env.NOTION_TEST_PAGE_ID;

describe("Integration Test - Notion MD Crawler", () => {
  let client: Client;
  let crawl: ReturnType<typeof crawler>;

  beforeAll(() => {
    if (!NOTION_API_TOKEN || !NOTION_TEST_PAGE_ID) {
      console.warn("⚠️  Required environment variables not set. Integration tests will be skipped.");
      console.warn("   Set NOTION_API_TOKEN and NOTION_TEST_PAGE_ID in .env file.");
      return;
    }

    const serializers = {
      property: {
        relation: (name: string, block: any) => {
          console.log(`🔗 Relation property: ${name}`, block);
          return name;
        },
      },
      block: {
        // Custom block serializer example
        heading_1: (block: any) => {
          return `# ${block.heading_1.rich_text.map((t: any) => t.plain_text).join('')}`;
        },
      },
    };

    client = new Client({
      auth: NOTION_API_TOKEN,
    });

    crawl = crawler({
      client,
      serializers,
    });
  });

  it.skipIf(!process.env.RUN_INTEGRATION_TESTS || !NOTION_API_TOKEN || !NOTION_TEST_PAGE_ID)("should create client with @notionhq/client 4.0.0", () => {
    expect(client).toBeDefined();
    expect(client.pages).toBeDefined();
    expect(client.blocks).toBeDefined();
    expect(client.databases).toBeDefined();
  });

  it.skipIf(!process.env.RUN_INTEGRATION_TESTS || !NOTION_API_TOKEN || !NOTION_TEST_PAGE_ID)("should crawl notion pages successfully", async () => {

    console.log(`🚀 Testing notion-md-crawler with @notionhq/client 4.0.0`);
    console.log(`📄 Target Page ID: ${NOTION_TEST_PAGE_ID}`);

    let pageCount = 0;
    let successCount = 0;
    let errorCount = 0;
    const crawledPages: any[] = [];

    for await (const result of crawl(NOTION_TEST_PAGE_ID!)) {
      pageCount++;
      
      if (result.success) {
        successCount++;
        crawledPages.push(result.page);
        console.log(`✅ [${pageCount}] Successfully crawled: ${result.page.metadata.title}`);
        console.log(`   📎 URL: ${result.page.metadata.url || 'N/A'}`);
        
        // Join lines to create markdown content
        const markdown = result.page.lines.join('\n');
        console.log(`   📝 Content length: ${markdown.length} characters`);
        
        // Show first 100 characters of markdown
        const preview = markdown.substring(0, 100);
        console.log(`   📖 Preview: ${preview}${markdown.length > 100 ? '...' : ''}`);
      } else {
        errorCount++;
        console.error(`❌ [${pageCount}] Failed to crawl page:`, result.failure.reason);
      }
    }

    console.log(`\n📊 Test Results:`);
    console.log(`   Total pages processed: ${pageCount}`);
    console.log(`   Successfully crawled: ${successCount}`);
    console.log(`   Failed: ${errorCount}`);
    
    // Assertions
    expect(pageCount).toBeGreaterThan(0);
    expect(successCount).toBeGreaterThan(0);
    expect(crawledPages.length).toBeGreaterThan(0);
    
    // Check first page structure
    const firstPage = crawledPages[0];
    expect(firstPage).toBeDefined();
    expect(firstPage.metadata).toBeDefined();
    expect(firstPage.metadata.id).toBeDefined();
    expect(firstPage.metadata.title).toBeDefined();
    expect(firstPage.metadata.createdTime).toBeDefined();
    expect(firstPage.metadata.lastEditedTime).toBeDefined();
    expect(firstPage.lines).toBeDefined();
    expect(Array.isArray(firstPage.lines)).toBe(true);
    expect(firstPage.properties).toBeDefined();
    expect(Array.isArray(firstPage.properties)).toBe(true);
    
    if (errorCount === 0) {
      console.log("🎉 All tests passed! @notionhq/client 4.0.0 is working correctly.");
    } else {
      console.log("⚠️  Some pages failed to crawl. Please check the errors above.");
    }
  }, 30000); // 30 second timeout for network requests
});