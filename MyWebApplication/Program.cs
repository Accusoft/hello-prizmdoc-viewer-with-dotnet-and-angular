using Yarp.ReverseProxy.Transforms;

namespace MyWebApplication;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        ConfigUtil.ValidateConfiguration(builder.Configuration);

        // Create reverse proxy routing configuration. Alternatively, you can add this to your
        // appsettings.json file and use builder.Configuration instead.
        var yarpConfiguration = new ConfigurationManager() {
            ["ReverseProxy:Routes:route1:ClusterId"] = "cluster1",
            ["ReverseProxy:Routes:route1:Match:Path"] = "/pas-proxy/{**slug}",
            ["ReverseProxy:Clusters:cluster1:Destinations:destination1:Address"] = builder.Configuration["PrizmDoc:PasBaseUrl"]
        };

        // Add services to the container.

        builder.Services.AddControllersWithViews();

        builder.Services
            .AddReverseProxy()
            .LoadFromConfig(yarpConfiguration.GetSection("ReverseProxy"))
            .AddTransforms(builderContext =>
            {
                // Strip the /pas-proxy prefix from the path
                builderContext.AddPathRemovePrefix(prefix: "/pas-proxy");
                
                // Inject the PrizmDoc Cloud API key if one was defined
                var apiKey = builder.Configuration["PrizmDoc:CloudApiKey"];
                if (apiKey != null && apiKey.Trim() != "")
                {
                    builderContext.AddRequestHeader("acs-api-key", apiKey, false);
                }
            });

        // In production, the Angular files will be served from this directory
        builder.Services.AddSpaStaticFiles(configuration =>
        {
            configuration.RootPath = "ClientApp/dist";
        });

        // Define a named HttpClient that is configured to send requests to PAS (PrizmDoc Application Services).
        builder.Services.AddHttpClient("PAS", httpClient => PasUtil.ConfigureHttpClientForPas(httpClient, builder.Configuration));

        var app = builder.Build();

        app.UseHttpLogging();

        app.MapReverseProxy();

        // Add CSP header to all responses.
        app.Use(async (context, next) =>
        {
            context.Response.Headers.Add("Content-Security-Policy", "script-src 'self'");
            await next();
        });

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
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
        if (!app.Environment.IsDevelopment())
        {
            app.UseSpaStaticFiles();
        }

        app.UseRouting();

        app.MapControllerRoute(
            name: "default",
            pattern: "{controller}/{action=Index}/{id?}");

        app.MapFallbackToFile("index.html");

        app.Run();
    }
}
