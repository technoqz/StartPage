<?php

/*
* DANGER! This is just an example and it is in absolutely no protection from intruders. 
* Hackers can use any proxy, including this one, for their not-so-good purposes.
*
*/

// Allow CORS for all origins (you can restrict this later if needed)
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/xml; charset=UTF-8');

// Check if the 'url' parameter is provided in the GET request
if (!isset($_GET['url']) || empty($_GET['url'])) {
    http_response_code(400);
    //echo '<error>No URL provided</error>';
    exit;
}

// Get the RSS feed URL from the query parameter
$feedUrl = $_GET['url'];

// Validate the URL
if (!filter_var($feedUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo '<error>Invalid URL</error>';
    exit;
}

// Initialize cURL to fetch the RSS feed
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $feedUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // Follow redirects
curl_setopt($ch, CURLOPT_TIMEOUT, 10); // Set a timeout to avoid hanging

// Optionally, set a User-Agent to mimic a browser (some servers block requests without it)
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

// Execute the request
$response = curl_exec($ch);

// Check for cURL errors
if ($response === false) {
    http_response_code(500);
    echo '<error>Failed to fetch RSS feed: ' . curl_error($ch) . '</error>';
    curl_close($ch);
    exit;
}

// Get the HTTP status code
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// If the request was successful, return the RSS content
if ($httpCode == 200) {
    echo $response;
} else {
    http_response_code($httpCode);
    echo '<error>Failed to fetch RSS feed. HTTP Code: ' . $httpCode . '</error>';
}
?>