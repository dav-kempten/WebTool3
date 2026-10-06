<#
  Packt den Produktions-Build als ZIP fuer den Server.

  Compress-Archive und ZipFile::CreateFromDirectory schreiben unter Windows
  PowerShell 5.1 Backslashes in die Pfadnamen im Archiv. Linux entpackt daraus
  Dateien namens "media\primeicons-..." statt eines media/-Ordners, womit die
  Icon-Schriften fehlen. Deshalb wird hier Eintrag fuer Eintrag mit
  Schraegstrichen gepackt und das Ergebnis geprueft.

  Bewusst ohne Umlaute und Sonderzeichen: Windows PowerShell 5.1 liest .ps1
  ohne BOM als ANSI, dann zerlegt ein Gedankenstrich den Parser.
#>
param(
  [string]$Dist = (Join-Path $PSScriptRoot '..\dist\frontend-new\browser'),
  [string]$OutDir = (Join-Path $PSScriptRoot '..\dist')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$BS = [char]92
$FS = [char]47

$src = (Resolve-Path $Dist).Path
$pkg = Get-Content (Join-Path $PSScriptRoot '..\package.json') -Raw | ConvertFrom-Json
$version = $pkg.version -replace '\.0$', ''
$name = 'webtool-frontend-v{0}-{1}.zip' -f $version, (Get-Date -Format 'yyyy-MM-dd')
$zip = Join-Path ((Resolve-Path $OutDir).Path) $name

if ([System.IO.File]::Exists($zip)) { [System.IO.File]::Delete($zip) }

$level = [System.IO.Compression.CompressionLevel]::Optimal
$archive = [System.IO.Compression.ZipFile]::Open($zip, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  $rootLen = $src.Length + 1
  foreach ($f in (Get-ChildItem -Path $src -Recurse -File | Sort-Object FullName)) {
    $entry = $f.FullName.Substring($rootLen).Replace($BS, $FS)
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $f.FullName, $entry, $level)
  }
} finally {
  if ($archive) { $archive.Dispose() }
}

$check = [System.IO.Compression.ZipFile]::OpenRead($zip)
try {
  $bad = @($check.Entries | Where-Object { $_.FullName.Contains($BS) }).Count
  if ($bad -gt 0) { throw "$bad Eintraege enthalten Backslashes, Archiv unbrauchbar." }
  if (-not ($check.Entries | Where-Object { $_.FullName -eq 'index.html' })) {
    throw 'index.html fehlt im Archiv.'
  }
  $count = $check.Entries.Count
} finally {
  $check.Dispose()
}

'{0}' -f $zip
'Version {0} | {1} Dateien | {2:N2} MB' -f $version, $count, ((Get-Item $zip).Length / 1MB)
