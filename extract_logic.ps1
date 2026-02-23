$c = [System.IO.File]::ReadAllText('C:\Users\Evelyn\Documents\makemoments\.ignore\ourheart css and js\index-BGg48v-x.js')
$i = $c.IndexOf('font-mono')
if ($i -ge 0) {
    $start = [Math]::Max(0, $i - 1000)
    $len = [Math]::Min(2000, $c.Length - $start)
    $c.Substring($start, $len) | Out-File -FilePath 'C:\Users\Evelyn\Documents\makemoments\debug_output.txt'
} else {
    'font-mono not found' | Out-File -FilePath 'C:\Users\Evelyn\Documents\makemoments\debug_output.txt'
}
