param($url)
if(-not $url.startsWith('//at.alicdn.com/t/font_')){
    return
}
$old = [Regex]::match($(gc ./demo/index.html),"//at.alicdn.com/t/font_([^']+)").value

$html = $(gc ./demo/index.html).Replace($old,$url)
sc -Path ./demo/index.html -Value $html -Encoding UTF8