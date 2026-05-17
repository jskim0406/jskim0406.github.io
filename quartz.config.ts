import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "pine note",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    locale: "ko-KR",
    analytics: null,
    baseUrl: "jskim0406.github.io",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "created",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      // typography: {
      //   header: "Schibsted Grotesk",
      //   body: "Source Sans Pro",
      //   code: "IBM Plex Mono",
      // },
      typography: {
        header: "Inter",
        body: "IBM Plex Sans KR",
        code: "JetBrains Mono",
      },
      // colors: {
      //   lightMode: {
      //     light: "#faf8f8",
      //     lightgray: "#e5e5e5",
      //     gray: "#b8b8b8",
      //     darkgray: "#4e4e4e",
      //     dark: "#2b2b2b",
      //     secondary: "#284b63",
      //     tertiary: "#84a59d",
      //     highlight: "rgba(143, 159, 169, 0.15)",
      //     textHighlight: "#fff23688",
      //   },
      //   darkMode: {
      //     light: "#161618",
      //     lightgray: "#393639",
      //     gray: "#646464",
      //     darkgray: "#d4d4d4",
      //     dark: "#ebebec",
      //     secondary: "#7b97aa",
      //     tertiary: "#84a59d",
      //     highlight: "rgba(143, 159, 169, 0.15)",
      //     textHighlight: "#b3aa0288",
      //   },
      // },
      colors: {
        lightMode: {
          light: "#fafafa",        // 더 중성적 흰색
          lightgray: "#e5e5e5",
          gray: "#9a9a9a",
          darkgray: "#3a3a3a",
          dark: "#1a1a1a",
          secondary: "#3a3a3a",    // ← 무채색에 가깝게 (기존 파란기 제거)
          tertiary: "#6b6b6b",     // ← 동일하게 무채
          highlight: "rgba(0, 0, 0, 0.05)",
          textHighlight: "#ffec9988",
        },
        darkMode: {
          light: "#0e0e10",
          lightgray: "#2a2a2c",
          gray: "#5a5a5c",
          darkgray: "#d0d0d2",
          dark: "#f0f0f2",
          secondary: "#a0a0a4",    // ← 무채
          tertiary: "#787878",
          highlight: "rgba(255, 255, 255, 0.06)",
          textHighlight: "#d4c10288",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
