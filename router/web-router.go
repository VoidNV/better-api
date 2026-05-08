package router

import (
	"embed"
	"fmt"
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/controller"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/QuantumNous/new-api/setting/system_setting"
	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

// ThemeAssets holds the embedded frontend assets for both themes.
type ThemeAssets struct {
	DefaultBuildFS   embed.FS
	DefaultIndexPage []byte
	ClassicBuildFS   embed.FS
	ClassicIndexPage []byte
}

func siteBaseURL(c *gin.Context) string {
	base := strings.TrimRight(strings.TrimSpace(system_setting.ServerAddress), "/")
	if strings.HasPrefix(base, "http://") || strings.HasPrefix(base, "https://") {
		return base
	}

	scheme := "https"
	if c.Request.TLS == nil {
		if forwardedProto := c.GetHeader("X-Forwarded-Proto"); forwardedProto != "" {
			scheme = strings.Split(forwardedProto, ",")[0]
		} else {
			scheme = "http"
		}
	}

	return fmt.Sprintf("%s://%s", scheme, c.Request.Host)
}

func sitemapXML(c *gin.Context) string {
	base := siteBaseURL(c)
	paths := []struct {
		Path       string
		Changefreq string
		Priority   string
	}{
		{Path: "/", Changefreq: "weekly", Priority: "1.0"},
		{Path: "/pricing", Changefreq: "daily", Priority: "0.9"},
		{Path: "/about", Changefreq: "monthly", Priority: "0.6"},
		{Path: "/privacy-policy", Changefreq: "yearly", Priority: "0.3"},
		{Path: "/user-agreement", Changefreq: "yearly", Priority: "0.3"},
	}

	var builder strings.Builder
	builder.WriteString(`<?xml version="1.0" encoding="UTF-8"?>` + "\n")
	builder.WriteString(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` + "\n")
	for _, item := range paths {
		builder.WriteString("  <url>\n")
		builder.WriteString(fmt.Sprintf("    <loc>%s%s</loc>\n", base, item.Path))
		builder.WriteString(fmt.Sprintf("    <changefreq>%s</changefreq>\n", item.Changefreq))
		builder.WriteString(fmt.Sprintf("    <priority>%s</priority>\n", item.Priority))
		builder.WriteString("  </url>\n")
	}
	builder.WriteString("</urlset>\n")
	return builder.String()
}

func robotsTXT(c *gin.Context) string {
	return fmt.Sprintf(`User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: Meta-ExternalAgent
Disallow: /

User-agent: *
Allow: /

Sitemap: %s/sitemap.xml
`, siteBaseURL(c))
}

func SetWebRouter(router *gin.Engine, assets ThemeAssets) {
	defaultFS := common.EmbedFolder(assets.DefaultBuildFS, "web/default/dist")
	classicFS := common.EmbedFolder(assets.ClassicBuildFS, "web/classic/dist")
	themeFS := common.NewThemeAwareFS(defaultFS, classicFS)

	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())
	router.GET("/robots.txt", func(c *gin.Context) {
		c.Data(http.StatusOK, "text/plain; charset=utf-8", []byte(robotsTXT(c)))
	})
	router.GET("/sitemap.xml", func(c *gin.Context) {
		c.Data(http.StatusOK, "application/xml; charset=utf-8", []byte(sitemapXML(c)))
	})
	router.Use(static.Serve("/", themeFS))
	router.NoRoute(func(c *gin.Context) {
		c.Set(middleware.RouteTagKey, "web")
		if strings.HasPrefix(c.Request.RequestURI, "/v1") || strings.HasPrefix(c.Request.RequestURI, "/api") || strings.HasPrefix(c.Request.RequestURI, "/assets") {
			controller.RelayNotFound(c)
			return
		}
		c.Header("Cache-Control", "no-cache")
		if common.GetTheme() == "classic" {
			c.Data(http.StatusOK, "text/html; charset=utf-8", assets.ClassicIndexPage)
		} else {
			c.Data(http.StatusOK, "text/html; charset=utf-8", assets.DefaultIndexPage)
		}
	})
}
