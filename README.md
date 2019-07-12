# MJML Email Development Starter

This is a streamlined environment for developing multilingual, multipart emails with focus on DRY and developer productivity.

The tool lets developers author emails in both HTML and plain text versions that will be compatible with many email clients, thanks to the use of the [MJML](https://mjml.io) library. The output of the tool is a set files for each variant (HTML/text) and language.

The actual use of the output files is out of this tool's scope. Your application could load the files and send them via SMTP, or you could use the output directly in a marketing email tool such as Mailchimp, Campaign Monitor, etc.

The tool has the following features:

 - HTML Email Templates based on [MJML](https://mjml.io) v3
 - Support for both HTML and text versions of your emails (with complete control over the text version)
 - LiveReload to see changes to HTML emails in near realtime in the browser. 
 - Composition/reuse with template inheritance via Nunjucks templates
 - Internationalisation support (i18n)

## How to run this?

> Consider using `nvm` to manage multiple Node versions on your system. 

Pre-requisites: 

 - Node (v10) with NPM
 
Preparing your machine:

    $ npm install gulp -g                   # if needed
    $ npm install

Build and start a LiveReload-enabled server for local development:

    $ gulp
    
Then hit [http://localhost:1980](http://localhost:1980) to see a listing of all the output files. 
Any file can be open in the browser and every HTML file will be reloaded as you make changes in sources.

## Building for production

Run:

    $ gulp build --env production
    
All files are bundled in the `output` directory and images from `src/assets` will be copied in the `output/assets` directory

Arguments:

__`--out`__: Replaces the default output directory (`./output`) with the one provided. Example:

    $ gulp build --env production --out /path/to/your/output/dir/ 
 
## Configuration
 
A `config.js` file exists to provide configuration parameters for the build. The following attribute is supported:

 - **`imageBase`**: The absolute URL where images are to be accessible publicly.


## About images

Images in emails are expected to be hosted on a public web server (ex: S3). This tool does not embed images into emails.

As a convenience for developers when working locally (more specifically using the `development` environment), the image paths will be adjusted so that they point to the local file instead of a fully absolute URL. For that process to work, the `$IMGPATH$` replacement pattern needs to be prepended to all references to images in any of the `.mjml` templates.

Example:

    <mj-image width="100" src="$IMGBASE$/logo.gif" />
    
This would refer to an image stored in the following directory: `src/assets/logo.gif`.

**Note**: Usage of the `$IMGBASE$` pattern is not required if your images are already on a public server.

It is not part of the scope of this tool to sync or upload images to a public hosting environment. All the tool does is repatriate every image file under the `src/assets` directory into the `output/assets` directory when building the project. Those files should then be uploaded/synced to a Web server serving static files.

When building templates for production (see _Building for production_ below), the `$IMGBASE$` variables will be replaced by the `imageBase` configuration attribute in `config.js`.

## About translations / i18n

The output of the tool is a different version of each email in both HTML and text version, in all languages that have a corresponding `messages.yaml` file under the `src/locales/[LANG]` directory.

The `messages.yaml` files is a simple hierarchical data structure that maps keys to the actual value in a specific language.

To use translated strings in emails, use the following delimiter: `_(messages.[KEY])`, where `[KEY]` is the dot-delimited path that leads to the string you want in `messages.yaml`.

For example, given a `messages.yaml` file under `src/locales/en` with the following contents:

    footer:
      from: "Sent by YourCompany"

You would include that translated string in your source files as such: `_(messages.footer.from)`

The replacement process is setup to work on for all files under `src/templates/html` and `src/templates/text`.
 
## Dynamic contents
 
If your emails are going to be rendered by your application with dynamic contents, make sure you properly escape your dynamic content placeholders if your app's templating language uses similar tags as Nunjucks.

For example, if you are going to render your final emails using Django's templating language, the `{{ var }}` placeholders are the same as what Nunjucks expects. To keep your dynamic placeholder, escape them with the `{% raw %}` escape tag.

    <p>{% raw %}{{ some_dynamic_variable }}{% endraw %}</p>
    
This will generate the following output:

    <p>{{ some_dynamic_variable }}</p>

Without the `{% raw %}` escape tag, the output would be

    <p></p>
 
This is because Nunjucks tries to substitute the `{{ some_dynamic_variable }}` placeholder with a variable from its context. Because there is no such variable, the output is simply empty.

## Caveats

### RFC-2822 conformance
 
MJML tends to generate HTML with very long lines (longer than 998 characters) without any line breaks. Some email clients (ex: Gmail) do not properly deal with long lines in emails, mostly because of the [RFC-2822 - Internet Message Format (see 2.1.1 - Line Length Limits)](https://www.ietf.org/rfc/rfc2822.txt) specification.

This happens mostly when you nest many MJML components within each other, for example:

``` html
    <mj-section>
        <mj-column width="50%">
            <mj-button>
               Click me    <!-- The HTML output could include a line longer than 998 characters -->
            </mj-button>   
        </mj-column>
    </mj-section>
```

An observable side effect of those long lines in incompatible clients is often missing/cut/discarded attributes in the final HTML. 

A possible solution is to remove some levels of nesting and get rid of the `mj-column` (in that specific case):

``` html
    <mj-section>
        <mj-button>
           Click me    <!-- Lines will be shorter, and more email clients will be happy -->
        </mj-button>   
    </mj-section>
```

**Other Workarounds**

 1. Encode your email contents as Base64 when sending them, which will naturally break lines but with a cost of about 20-30% increase on email size.
 2. Encode your email contents with [`quoted-printable`](https://en.wikipedia.org/wiki/Quoted-printable)
 
### `mj-include` tag not properly working 

The `<mj-include>` MJML tag does not currently work as there is an issue with the way it tries to find the  files included.
 