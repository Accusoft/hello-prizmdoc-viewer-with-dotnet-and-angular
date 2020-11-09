import { Component, OnInit, OnChanges, Renderer2, Inject, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { DOCUMENT } from '@angular/common';

const VIEWER_ASSETS_BASE_ROUTE = '/assets/viewer-assets';
const PAS_PROXY_BASE_ROUTE = '/pas-proxy';
declare var window: any;

@Component({
  selector: 'app-prizmdoc-viewer-wrapper',
  templateUrl: './prizmdoc-viewer-wrapper.component.html',
  styleUrls: ['./prizmdoc-viewer-wrapper.component.css']
})
export class PrizmDocViewerWrapperComponent implements OnInit, OnChanges {

  // This is the one required input. Once it is set to an actual value, the
  // viewer will be instantiated with this viewingSessionId.
  @Input()
  viewingSessionId: string;

  @Input()
  width = "100%";

  @Input()
  height = "100%";

  @Output()
  viewerControl = new EventEmitter<any>();

  prerequisiteError: Error;

  @ViewChild('prizmdocViewerContainer', { static: false })
  private container:ElementRef;

  private viewerCreated: boolean;
  private static prerequisites = {};

  constructor(
    private renderer2: Renderer2
  ) { }

  async ngOnInit(): Promise<void> {
    await this.ensurePrerequisites();
  }

  ngOnChanges(): void {
    // If the viewer has not been created and we do have a viewingSessionId, create the viewer.
    if (!this.viewerCreated && this.viewingSessionId) {
      this.createViewer();
    }
  }

  // Ensures the viewer prerequisites have been added to the HTML head and have loaded.
  // This only happens once, the first time a viewer is instantiated.
  private async ensurePrerequisites(): Promise<void> {
    try {
      // These resources can be safely loaded in parallel.
      await Promise.all([
        this.ensureScriptHasLoaded(`${VIEWER_ASSETS_BASE_ROUTE}/js/viewercontrol.js`),
        this.ensureScriptHasLoaded(`${VIEWER_ASSETS_BASE_ROUTE}/js/viewerCustomizations.js`),
        this.ensureScriptHasLoaded(`${VIEWER_ASSETS_BASE_ROUTE}/js/jquery-3.4.1.min.js`),
        this.ensureScriptHasLoaded(`${VIEWER_ASSETS_BASE_ROUTE}/js/underscore.min.js`),
        this.ensureCssHasLoaded(`${VIEWER_ASSETS_BASE_ROUTE}/css/viewer.css`),
        this.ensureCssHasLoaded(`${VIEWER_ASSETS_BASE_ROUTE}/css/normalize.min.css`),
      ]);
      // These resources must be loaded last, and in this order.
      await this.ensureScriptHasLoaded(`${VIEWER_ASSETS_BASE_ROUTE}/js/jquery.hotkeys.min.js`);
      await this.ensureScriptHasLoaded(`${VIEWER_ASSETS_BASE_ROUTE}/js/viewer.js`);
    } catch (err) {
      this.prerequisiteError = err;
    }
  }

  private async createViewer(): Promise<void> {
    await this.ensurePrerequisites();

    // This is where the non-Angular viewer is actually initialized, and where
    // you can customize the viewer construction options. See
    // https://help.accusoft.com/PrizmDoc/latest/HTML/external-jQuery.fn.html#~Options
    const container = window.$(this.container.nativeElement).pccViewer({
      documentID: this.viewingSessionId,
      imageHandlerUrl: PAS_PROXY_BASE_ROUTE,                     // Base path the viewer should use to make requests to PAS (PrizmDoc Application Services).
      viewerAssetsPath: VIEWER_ASSETS_BASE_ROUTE,                // Base path the viewer should use for static assets
      resourcePath: `${VIEWER_ASSETS_BASE_ROUTE}/viewer-assets`, // Base path the viewer should use for images
      language: window.viewerCustomizations.languages['en-US'],
      template: window.viewerCustomizations.template,
      icons: window.viewerCustomizations.icons,
      annotationsMode: "LayeredAnnotations", // Use the new "LayeredAnnotations" system, which will persist annotation data as JSON (instead of the default "LegacyAnnotations" system, which uses a different XML format)
      redactionReasons: {
        enableRedactionReasonSelection: true, // Enable the UI to allow users to select a redaction reason.
        enableFreeformRedactionReasons: true, // Allow users to type a custom redaction reason.
        enableMultipleRedactionReasons: true, // Allow users to apply multiple redaction reasons to a single redaction (requires a backend running version 13.13 or higher)

        // TODO: Define your own set of redaction reasons for your users to pick from:
        reasons: [{
          reason: '1.a',                   // Text to apply to the redaction itself.
          description: 'Client Privilege'  // Optional extended description the user will see when choosing from the list of redaction reasons.
        }, {
          reason: '1.b',
          description: 'Privacy Information'
        }, {
          reason: '1.c'
        }]
      },
      uiElements: {
        attachments: true,                 // Enable the email attachments UI
        advancedSearch: true,              // Enable advanced search
      },
      immediateActionMenuMode: "hover",    // Enable immediate action menu
      attachmentViewingMode: "ThisViewer", // The email attachment will be opened in the same view
    });

    // Now that the viewer is constructed, emit the viewerControl as an output
    // so that the consumer of this component can have access to the
    // viewerControl client API.
    this.viewerControl.emit(container.viewerControl);
  }

  private ensureScriptHasLoaded (src) {
    return this.ensureHeadResourceExistsAndHasLoaded('script', 'src', src, { async: true });
  }

  private ensureCssHasLoaded (href) {
    return this.ensureHeadResourceExistsAndHasLoaded('link', 'href', href, { rel: 'stylesheet' });
  }

  private ensureHeadResourceExistsAndHasLoaded (tagName, urlPropertyName, urlValue, attributes) {
    return new Promise((resolve, reject) => {
      if (!PrizmDocViewerWrapperComponent.prerequisites[urlValue]) {
        PrizmDocViewerWrapperComponent.prerequisites[urlValue] = new ResourceLoadingState();

        const tag = this.renderer2.createElement(tagName);
        tag[urlPropertyName] = urlValue;

        for (const [k, v] of Object.entries(attributes || {})) {
          tag.setAttribute(k, v);
        }

        tag.onload = () => {
          tag.onerror = null;
          tag.onload = null;
          PrizmDocViewerWrapperComponent.prerequisites[urlValue].setLoaded();
        }

        tag.onerror = () => {
          tag.onerror = null;
          tag.onload = null;
          PrizmDocViewerWrapperComponent.prerequisites[urlValue].setErrored();
        }

        document.head.appendChild(tag);
      }

      if (PrizmDocViewerWrapperComponent.prerequisites[urlValue].isLoaded()) {
        resolve();
      } else if (PrizmDocViewerWrapperComponent.prerequisites[urlValue].isErrored()) {
        reject(new Error(`Failed to load ${urlValue}`));
      } else {
        PrizmDocViewerWrapperComponent.prerequisites[urlValue].onLoad(() => resolve());
        PrizmDocViewerWrapperComponent.prerequisites[urlValue].onError(() => reject(new Error(`Failed to load ${urlValue}`)));
      }
    });
  }
}

class ResourceLoadingState {
  private _isLoaded: boolean = false;
  private _isErrored: boolean = false;
  private _loadedCallbacks: (() => any)[] = [];
  private _errorCallbacks: ((err: Error) => any)[] = [];

  onLoad(f: () => any) {
    this._loadedCallbacks.push(f);
  }

  onError(f: (err: Error) => any) {
    this._errorCallbacks.push(f);
  }

  setLoaded() {
    this._isLoaded = true;
    this._loadedCallbacks.forEach(f => f());
  }

  setErrored(err) {
    this._isErrored = true;
    this._errorCallbacks.forEach(f => f(err));
  }

  isLoaded() {
    return this._isLoaded;
  }

  isErrored() {
    return this._isErrored;
  }
}
