using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.SpaServices.AngularCli;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SharpReverseProxy;

namespace MyWebApplication
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;

            ConfigUtil.ValidateConfiguration(Configuration);
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllersWithViews();

            // In production, the Angular files will be served from this directory
            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "ClientApp/dist";
            });

            // Define a named HttpClient that is configured to send requests to PAS (PrizmDoc Application Services).
            services.AddHttpClient("PAS", httpClient => PasUtil.ConfigureHttpClientForPas(httpClient, Configuration));
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILogger<Startup> logger)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();
            if (!env.IsDevelopment())
            {
                app.UseSpaStaticFiles();
            }

            // Setup a proxy route to PAS (PrizmDoc Application Services).
            //
            // The viewer will send all of its requests for document content to this web app
            // using a base route of /pas-proxy. We setup this route here to be a reverse proxy
            // back to the actual PAS host.
            //
            // If you are using PrizmDoc Cloud, this proxy will inject your API
            // key before forwarding the request.
            //
            // In a production application, you would want to setup this reverse proxy outside
            // of your web application, say using IIS or nginx.
            app.UseProxy(new List<ProxyRule> {
                new ProxyRule {
                    Matcher = uri => uri.AbsolutePath.StartsWith("/pas-proxy/"),
                    Modifier = (req, user) =>
                    {
                        // Create a corresponding request to the actual PAS host
                        var match = Regex.Match(req.RequestUri.PathAndQuery, "/pas-proxy/(.+)");
                        var path = match.Groups[1].Value;
                        var pasBaseUri = new Uri(Configuration["PrizmDoc:PasBaseUrl"]);
                        req.RequestUri = new Uri(pasBaseUri, path);

                        // Inject the PrizmDoc Cloud API key if one was defined
                        var apiKey = Configuration["PrizmDoc:CloudApiKey"];
                        if (apiKey != null && apiKey.Trim() != "") {
                            req.Headers.Add("acs-api-key", apiKey);
                        }
                    }
                }
            }, result =>
            {
                logger.LogDebug($"Proxy: {result.ProxyStatus} Url: {result.OriginalUri} Time: {result.Elapsed}");
                if (result.ProxyStatus == ProxyStatus.Proxied)
                {
                    logger.LogDebug($"        New Url: {result.ProxiedUri.AbsoluteUri} Status: {result.HttpStatusCode}");
                }
            });


            app.UseRouting();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller}/{action=Index}/{id?}");
            });

            app.UseSpa(spa =>
            {
                spa.Options.SourcePath = "ClientApp";

                if (env.IsDevelopment())
                {
                    // For more information about the first two options below, see
                    // https://docs.microsoft.com/en-us/aspnet/core/client-side/spa/angular?view=aspnetcore-3.1&tabs=visual-studio#run-ng-serve-independently

                    // Option 1:
                    //
                    // Automatically start an Angular CLI dev server in the
                    // background and forward appropriate traffic to it.
                    // Convenient, but makes restarting the ASP.NET application
                    // slower when you are working on C# code:
                    spa.UseAngularCliServer(npmScript: "start");

                    // Option 2:
                    //
                    // Requires you manually start the Angular CLI development
                    // server before running the ASP.NET application (cd
                    // ClientApp && npm start). Slightly more effort, but allows
                    // you to restart the ASP.NET application more rapidly when
                    // working on C# code:
                    // spa.UseProxyToSpaDevelopmentServer("http://localhost:4200");

                    // Option 3:
                    //
                    // Don't setup a proxy in the ASP.NET application at all.
                    // Instead, setup a proxy from the Angular CLI dev server to
                    // this ASP.NET application, and do your development on
                    // http://localhost:4200.
                    //
                    // See https://angular.io/guide/build#proxying-to-a-backend-server
                }
            });
        }
    }
}
