using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging;

namespace MyWebApplication.Controllers
{
    [ApiController]
    public class DocumentsController : ControllerBase
    {
        private readonly ILogger<DocumentsController> _logger;
        private readonly IFileProvider _fileProvider;
        private readonly IHttpClientFactory _httpClientFactory;

        public DocumentsController(ILogger<DocumentsController> logger, IWebHostEnvironment env, IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _fileProvider = new PhysicalFileProvider(env.ContentRootPath);
            _httpClientFactory = httpClientFactory;
        }

        [HttpGet("documents")]
        public IEnumerable<string> Get()
        {
            return _fileProvider.GetDirectoryContents("Documents")
                .Where(x => !x.IsDirectory)
                .Select(x => x.Name)
                .OrderBy(x => x)
                .ToList();
        }

        [HttpPost("documents/{requestedFilename}/beginViewing")]
        public async Task<ViewingSessionInfo> BeginViewing(string requestedFilename)
        {
            var pasClient = _httpClientFactory.CreateClient("PAS");

            // 1. Create a new viewing session
            var response = await pasClient.PostAsync("ViewingSession", new StringContent(JsonSerializer.Serialize(new
            {
                source = new
                {
                    type = "upload",
                    displayName = requestedFilename
                }
            })));
            response.EnsureSuccessStatusCode();

            // 2. Create a new viewing session which we will return to the
            //    client ASAP.
            var viewingSessionInfo = JsonSerializer.Deserialize<ViewingSessionInfo>(
                await response.Content.ReadAsStringAsync()
            );

            // 3. Queue a task to upload the source document to PAS (part of the
            //    PrizmDoc backend) so that it can start being converted to SVG.
            //    The viewer will request this content and receive it
            //    automatically once it is ready. We do this part on a
            //    background thread so that we don't block the viewingSessionId
            //    from being sent to the browser (where it is needed to
            //    instantiate the viewer).
#pragma warning disable CS4014
            Task.Run(async () =>
            {
                try {
                    // PUT <your_PAS_host>/ViewingSession/u{viewingSessionId}/SourceFile
                    var route = $"ViewingSession/u{viewingSessionInfo.viewingSessionId}/SourceFile";
                    var content = new StreamContent(System.IO.File.OpenRead(
                        _fileProvider.GetFileInfo(Path.Combine("Documents", requestedFilename)).PhysicalPath)
                    );
                    content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
                    response = await pasClient.PutAsync(route, content);
                    response.EnsureSuccessStatusCode();
                } catch (Exception e) {
                    _logger.LogError(e.ToString());
                }
            });
#pragma warning restore CS4014

            // Return the new viewingSessionId to the client.
            return viewingSessionInfo;
        }
    }

    public class ViewingSessionInfo
    {
        public string viewingSessionId { get; set; }
    }
}
