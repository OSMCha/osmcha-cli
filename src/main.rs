#[macro_use]
extern crate rocket;

use std::error::Error;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use clap::Parser;

use rocket::fairing::AdHoc;
use rocket::response::content::{RawCss, RawHtml, RawJavaScript, RawJson, RawXml};
use rocket::State;

use serde::Deserialize;
use tempfile::NamedTempFile;

#[get("/changeset.adiff")]
fn adiff(config: &State<Config>) -> Option<RawXml<String>> {
    let filename = &config.augmented_diff;
    let contents = fs::read_to_string(filename).ok()?;
    Some(RawXml(contents))
}

#[get("/")]
fn index() -> RawHtml<&'static str> {
    let html = include_str!(concat!(env!("OUT_DIR"), "/frontend/index.html"));
    RawHtml(html)
}

#[get("/style.css")]
fn css() -> RawCss<&'static str> {
    let css = include_str!(concat!(env!("OUT_DIR"), "/frontend/dist/style.css"));
    RawCss(css)
}

#[get("/main.js")]
fn bundle() -> RawJavaScript<&'static str> {
    let js = include_str!(concat!(env!("OUT_DIR"), "/frontend/dist/main.js"));
    RawJavaScript(js)
}

#[get("/main.js.map")]
fn bundle_map() -> RawJson<&'static str> {
    let map = include_str!(concat!(env!("OUT_DIR"), "/frontend/dist/main.js.map"));
    RawJson(map)
}

#[derive(Deserialize)]
struct Config {
    augmented_diff: PathBuf,
}

async fn view(augmented_diff: &Path) -> Result<(), rocket::Error> {
    let port = 48756;

    let figment = rocket::Config::figment()
        .merge(("port", port))
        .merge(("log_level", "off"))
        .merge(("augmented_diff", augmented_diff.to_path_buf()));

    let server = rocket::custom(figment)
        .mount("/", routes![adiff, index, css, bundle, bundle_map])
        .attach(AdHoc::config::<Config>())
        .launch();

    let url = "http://localhost:48756";
    println!("listening on {}", url);

    // NOTE: annoying in dev mode since it opens a new tab every time,
    // consider commenting out temporarily if this is a problem
    open::that(url);

    server.await?;

    Ok(())
}

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct CliArgs {
    /// Augmented Diff filename (when omitted, diff is read from stdin)
    augmented_diff: Option<PathBuf>,
}

#[rocket::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let args = CliArgs::parse();

    if let Some(filename) = args.augmented_diff {
        view(&filename).await?;
    } else {
        let mut file = NamedTempFile::new()?;
        io::copy(&mut io::stdin(), file.as_file_mut())?;
        view(file.path()).await?;
    };

    Ok(())
}
