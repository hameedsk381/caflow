$src = "d:\Personal-project\New folder\CAFlow_Antigravity_Master_Build_Documentation.docx"
$dst = "C:\Users\nehas\AppData\Local\Temp\doc_extract"
$zip = "C:\Users\nehas\AppData\Local\Temp\doc_temp.zip"

if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
New-Item -ItemType Directory -Path $dst | Out-Null
Copy-Item $src $zip
Expand-Archive $zip $dst -Force
Remove-Item $zip

$xmlPath = Join-Path $dst "word\document.xml"
$xmlContent = [xml](Get-Content $xmlPath -Raw)
$ns = New-Object System.Xml.XmlNamespaceManager($xmlContent.NameTable)
$ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")

$nodes = $xmlContent.SelectNodes("//w:t", $ns)
$allText = $nodes | ForEach-Object { $_.InnerText }
$fullText = $allText -join " "
$fullText | Out-File "C:\Users\nehas\AppData\Local\Temp\doc_text.txt" -Encoding UTF8
Write-Host "Done! Text saved to doc_text.txt"
Write-Host "---CONTENT START---"
$fullText
Write-Host "---CONTENT END---"
