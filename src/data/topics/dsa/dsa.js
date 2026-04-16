export const dsa = [
  // ============================================================
  // ARRAYS & STRINGS
  // ============================================================
  {
    id: 'dsa-two-pointer',
    title: 'Two Pointer Technique',
    category: 'Arrays & Strings',
    starterCode: `// Two Pointer Technique — JavaScript Implementations
// ===================================================

// 1. Two Sum (sorted array) — Opposite Direction Pointers
function twoSumSorted(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) return [left, right];
    else if (sum < target) left++;
    else right--;
  }
  return [-1, -1];
}

console.log('=== Two Sum Sorted ===');
console.log('Array: [1,2,3,4,6], target=6');
console.log('Result:', twoSumSorted([1,2,3,4,6], 6));

// 2. Remove Duplicates (Same Direction Pointers)
function removeDuplicates(arr) {
  if (arr.length === 0) return 0;
  let slow = 0;
  for (let fast = 1; fast < arr.length; fast++) {
    if (arr[fast] !== arr[slow]) {
      slow++;
      arr[slow] = arr[fast];
    }
  }
  return slow + 1;
}

console.log('\\n=== Remove Duplicates ===');
const arr1 = [1,1,2,2,3,4,4,5];
const newLen = removeDuplicates(arr1);
console.log('Unique count:', newLen, '-> Array:', arr1.slice(0, newLen));

// 3. Container With Most Water
function maxArea(heights) {
  let left = 0, right = heights.length - 1;
  let maxWater = 0;
  while (left < right) {
    const width = right - left;
    const height = Math.min(heights[left], heights[right]);
    maxWater = Math.max(maxWater, width * height);
    if (heights[left] < heights[right]) left++;
    else right--;
  }
  return maxWater;
}

console.log('\\n=== Container With Most Water ===');
console.log('Heights: [1,8,6,2,5,4,8,3,7]');
console.log('Max area:', maxArea([1,8,6,2,5,4,8,3,7]));

// 4. Three Sum
function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i-1]) continue;
    let left = i + 1, right = nums.length - 1;
    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);
        while (left < right && nums[left] === nums[left+1]) left++;
        while (left < right && nums[right] === nums[right-1]) right--;
        left++; right--;
      } else if (sum < 0) left++;
      else right--;
    }
  }
  return result;
}

console.log('\\n=== Three Sum (target=0) ===');
console.log('Array: [-1,0,1,2,-1,-4]');
console.log('Triplets:', JSON.stringify(threeSum([-1,0,1,2,-1,-4])));

// 5. Move Zeroes
function moveZeroes(arr) {
  let slow = 0;
  for (let fast = 0; fast < arr.length; fast++) {
    if (arr[fast] !== 0) {
      [arr[slow], arr[fast]] = [arr[fast], arr[slow]];
      slow++;
    }
  }
  return arr;
}

console.log('\\n=== Move Zeroes ===');
console.log('Before: [0,1,0,3,12]');
console.log('After:', moveZeroes([0,1,0,3,12]));
`,
    content: `
<h1>Two Pointer Technique</h1>
<p>The <strong>two pointer technique</strong> is one of the most fundamental algorithmic patterns for array and string problems. It uses two indices that traverse the data structure in a coordinated way, often reducing O(n&sup2;) brute force to <strong>O(n)</strong>.</p>

<div class="warning-note">Two pointers is THE most asked pattern in SDE-2/SDE-3 coding rounds. Master every variant below.</div>

<h2>Pattern Overview</h2>
<pre><code>Opposite Direction:          Same Direction (Slow/Fast):
  L ------&gt;&gt;  &lt;&lt;------ R      S --&gt;  F ------&gt;&gt;
  [1, 2, 3, 4, 5, 6, 7]      [1, 1, 2, 2, 3, 4, 4]
  Converge toward center       Fast scouts ahead, slow writes</code></pre>

<h2>1. Opposite Direction Pointers</h2>
<p>Start one pointer at the beginning and one at the end. Converge based on a condition.</p>

<h3>Two Sum — Sorted Array</h3>
<pre><code>// C++ — O(n) time, O(1) space
vector&lt;int&gt; twoSumSorted(vector&lt;int&gt;&amp; nums, int target) {
    int left = 0, right = nums.size() - 1;
    while (left &lt; right) {
        int sum = nums[left] + nums[right];
        if (sum == target) return {left, right};
        else if (sum &lt; target) left++;
        else right--;
    }
    return {-1, -1};
}</code></pre>

<h3>Container With Most Water</h3>
<pre><code>// C++ — O(n) time, O(1) space
int maxArea(vector&lt;int&gt;&amp; height) {
    int left = 0, right = height.size() - 1;
    int maxWater = 0;
    while (left &lt; right) {
        int w = right - left;
        int h = min(height[left], height[right]);
        maxWater = max(maxWater, w * h);
        if (height[left] &lt; height[right]) left++;
        else right--;
    }
    return maxWater;
}</code></pre>

<h2>2. Same Direction Pointers (Slow/Fast)</h2>
<h3>Remove Duplicates from Sorted Array</h3>
<pre><code>// C++ — O(n) time, O(1) space
int removeDuplicates(vector&lt;int&gt;&amp; nums) {
    if (nums.empty()) return 0;
    int slow = 0;
    for (int fast = 1; fast &lt; nums.size(); fast++) {
        if (nums[fast] != nums[slow]) {
            slow++;
            nums[slow] = nums[fast];
        }
    }
    return slow + 1;
}

// Visual:
// [1, 1, 2, 2, 3]
//  S  F              nums[F]=1 == nums[S]=1, skip
//  S     F           nums[F]=2 != nums[S]=1, slow++, copy
//     S     F        nums[F]=2 == nums[S]=2, skip
//     S        F     nums[F]=3 != nums[S]=2, slow++, copy
//        S           Result: [1, 2, 3, ...] length=3</code></pre>

<h3>Move Zeroes</h3>
<pre><code>// C++ — O(n) time, O(1) space
void moveZeroes(vector&lt;int&gt;&amp; nums) {
    int slow = 0;
    for (int fast = 0; fast &lt; nums.size(); fast++) {
        if (nums[fast] != 0) {
            swap(nums[slow], nums[fast]);
            slow++;
        }
    }
}</code></pre>

<h2>3. Three Pointer / 3Sum</h2>
<pre><code>// C++ — O(n^2) time, O(1) space (excl. output)
vector&lt;vector&lt;int&gt;&gt; threeSum(vector&lt;int&gt;&amp; nums) {
    sort(nums.begin(), nums.end());
    vector&lt;vector&lt;int&gt;&gt; result;
    for (int i = 0; i &lt; (int)nums.size() - 2; i++) {
        if (i &gt; 0 &amp;&amp; nums[i] == nums[i-1]) continue; // skip duplicates
        int left = i + 1, right = nums.size() - 1;
        while (left &lt; right) {
            int sum = nums[i] + nums[left] + nums[right];
            if (sum == 0) {
                result.push_back({nums[i], nums[left], nums[right]});
                while (left &lt; right &amp;&amp; nums[left] == nums[left+1]) left++;
                while (left &lt; right &amp;&amp; nums[right] == nums[right-1]) right--;
                left++; right--;
            } else if (sum &lt; 0) left++;
            else right--;
        }
    }
    return result;
}</code></pre>

<h2>4. Trapping Rain Water</h2>
<pre><code>// C++ — O(n) time, O(1) space
int trap(vector&lt;int&gt;&amp; height) {
    int left = 0, right = height.size() - 1;
    int leftMax = 0, rightMax = 0, water = 0;
    while (left &lt; right) {
        if (height[left] &lt; height[right]) {
            leftMax = max(leftMax, height[left]);
            water += leftMax - height[left];
            left++;
        } else {
            rightMax = max(rightMax, height[right]);
            water += rightMax - height[right];
            right--;
        }
    }
    return water;
}</code></pre>

<h2>Complexity Reference Table</h2>
<table>
<tr><th>Problem</th><th>Pattern</th><th>Time</th><th>Space</th></tr>
<tr><td>Two Sum (sorted)</td><td>Opposite</td><td>O(n)</td><td>O(1)</td></tr>
<tr><td>Container With Most Water</td><td>Opposite</td><td>O(n)</td><td>O(1)</td></tr>
<tr><td>Trapping Rain Water</td><td>Opposite</td><td>O(n)</td><td>O(1)</td></tr>
<tr><td>Remove Duplicates</td><td>Same direction</td><td>O(n)</td><td>O(1)</td></tr>
<tr><td>Move Zeroes</td><td>Same direction</td><td>O(n)</td><td>O(1)</td></tr>
<tr><td>3Sum</td><td>Sort + opposite</td><td>O(n&sup2;)</td><td>O(1)</td></tr>
<tr><td>4Sum</td><td>Sort + nested opposite</td><td>O(n&sup3;)</td><td>O(1)</td></tr>
<tr><td>Valid Palindrome</td><td>Opposite</td><td>O(n)</td><td>O(1)</td></tr>
</table>

<div class="qa-block">
<div class="qa-q">Q: Given a sorted array, find a pair with target sum in O(n) time.</div>
<div class="qa-a">Use opposite-direction two pointers. Start left=0, right=n-1. If sum &lt; target, move left++. If sum &gt; target, move right--. Each element is visited at most once, giving O(n) time and O(1) space. This works because the array is sorted — moving left increases the sum, moving right decreases it.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: How do you handle duplicates in 3Sum?</div>
<div class="qa-a">After sorting, skip duplicate values for the outer loop (<code>if (i &gt; 0 &amp;&amp; nums[i] == nums[i-1]) continue</code>) and after finding a valid triplet, skip duplicate left/right values. This ensures no duplicate triplets in the output while maintaining O(n&sup2;) time.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: Why does the container-with-most-water greedy approach work?</div>
<div class="qa-a">We always move the pointer pointing to the shorter line. The key insight: if we moved the taller pointer, the width decreases and the height can only stay the same or decrease (bounded by the shorter line). So the area can never increase. Moving the shorter pointer gives a chance for a taller line to appear, potentially increasing the area.</div>
</div>
`
  },

  {
    id: 'dsa-sliding-window',
    title: 'Sliding Window Patterns',
    category: 'Arrays & Strings',
    starterCode: `// Sliding Window Patterns — JavaScript Implementations
// ====================================================

// 1. Fixed-Size Window: Max sum subarray of size k
function maxSumSubarray(arr, k) {
  let windowSum = 0, maxSum = -Infinity;
  for (let i = 0; i < arr.length; i++) {
    windowSum += arr[i];
    if (i >= k - 1) {
      maxSum = Math.max(maxSum, windowSum);
      windowSum -= arr[i - (k - 1)];
    }
  }
  return maxSum;
}

console.log('=== Fixed Window: Max Sum Subarray (k=3) ===');
console.log('Array: [2,1,5,1,3,2]');
console.log('Max sum:', maxSumSubarray([2,1,5,1,3,2], 3));

// 2. Variable-Size Window: Smallest subarray with sum >= target
function minSubArrayLen(target, nums) {
  let left = 0, sum = 0, minLen = Infinity;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    while (sum >= target) {
      minLen = Math.min(minLen, right - left + 1);
      sum -= nums[left];
      left++;
    }
  }
  return minLen === Infinity ? 0 : minLen;
}

console.log('\\n=== Variable Window: Min Subarray Sum >= 7 ===');
console.log('Array: [2,3,1,2,4,3]');
console.log('Min length:', minSubArrayLen(7, [2,3,1,2,4,3]));

// 3. Window + HashMap: Longest substring without repeating chars
function lengthOfLongestSubstring(s) {
  const lastSeen = new Map();
  let left = 0, maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    if (lastSeen.has(s[right]) && lastSeen.get(s[right]) >= left) {
      left = lastSeen.get(s[right]) + 1;
    }
    lastSeen.set(s[right], right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}

console.log('\\n=== Longest Substring Without Repeating ===');
console.log('"abcabcbb" ->', lengthOfLongestSubstring('abcabcbb'));
console.log('"bbbbb" ->', lengthOfLongestSubstring('bbbbb'));

// 4. At most K distinct characters
function longestWithKDistinct(s, k) {
  const freq = new Map();
  let left = 0, maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    freq.set(s[right], (freq.get(s[right]) || 0) + 1);
    while (freq.size > k) {
      freq.set(s[left], freq.get(s[left]) - 1);
      if (freq.get(s[left]) === 0) freq.delete(s[left]);
      left++;
    }
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}

console.log('\\n=== Longest with at most K=2 distinct ===');
console.log('"eceba" ->', longestWithKDistinct('eceba', 2));
console.log('"aa" ->', longestWithKDistinct('aa', 1));

// 5. Minimum Window Substring
function minWindow(s, t) {
  const need = new Map();
  for (const c of t) need.set(c, (need.get(c) || 0) + 1);
  let have = 0, required = need.size;
  let left = 0, minLen = Infinity, minStart = 0;
  const window = new Map();
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    window.set(c, (window.get(c) || 0) + 1);
    if (need.has(c) && window.get(c) === need.get(c)) have++;
    while (have === required) {
      if (right - left + 1 < minLen) {
        minLen = right - left + 1;
        minStart = left;
      }
      const lc = s[left];
      window.set(lc, window.get(lc) - 1);
      if (need.has(lc) && window.get(lc) < need.get(lc)) have--;
      left++;
    }
  }
  return minLen === Infinity ? '' : s.substring(minStart, minStart + minLen);
}

console.log('\\n=== Minimum Window Substring ===');
console.log('s="ADOBECODEBANC", t="ABC"');
console.log('Result:', minWindow('ADOBECODEBANC', 'ABC'));
`,
    content: `
<h1>Sliding Window Patterns</h1>
<p>The <strong>sliding window</strong> pattern maintains a contiguous subarray/substring window and slides it across the input. It converts brute-force O(n&times;k) or O(n&sup2;) solutions into <strong>O(n)</strong>.</p>

<h2>Framework for Sliding Window Problems</h2>
<pre><code>// Universal sliding window template (C++)
// 1. Expand window by moving right pointer
// 2. Update window state (sum, freq map, count)
// 3. Shrink window from left when constraint violated
// 4. Update answer at valid state

int slidingWindow(vector&lt;int&gt;&amp; nums, /* params */) {
    int left = 0, ans = 0;
    // window state variables here
    for (int right = 0; right &lt; nums.size(); right++) {
        // Add nums[right] to window
        while (/* window invalid */) {
            // Remove nums[left] from window
            left++;
        }
        // Update answer
        ans = max(ans, right - left + 1);
    }
    return ans;
}</code></pre>

<h2>1. Fixed-Size Window</h2>
<h3>Maximum Sum Subarray of Size K</h3>
<pre><code>// C++ — O(n) time, O(1) space
int maxSumSubarray(vector&lt;int&gt;&amp; arr, int k) {
    int windowSum = 0, maxSum = INT_MIN;
    for (int i = 0; i &lt; arr.size(); i++) {
        windowSum += arr[i];
        if (i &gt;= k - 1) {
            maxSum = max(maxSum, windowSum);
            windowSum -= arr[i - (k - 1)];
        }
    }
    return maxSum;
}

// Visual (k=3):
// [2, 1, 5, 1, 3, 2]
//  [------]           sum=8
//     [------]        sum=7
//        [------]     sum=9  &lt;-- max
//           [------]  sum=6</code></pre>

<h2>2. Variable-Size Window</h2>
<h3>Smallest Subarray with Sum &gt;= Target</h3>
<pre><code>// C++ — O(n) time, O(1) space
int minSubArrayLen(int target, vector&lt;int&gt;&amp; nums) {
    int left = 0, sum = 0, minLen = INT_MAX;
    for (int right = 0; right &lt; nums.size(); right++) {
        sum += nums[right];
        while (sum &gt;= target) {
            minLen = min(minLen, right - left + 1);
            sum -= nums[left++];
        }
    }
    return minLen == INT_MAX ? 0 : minLen;
}</code></pre>

<h2>3. Window with Hash Map</h2>
<h3>Longest Substring Without Repeating Characters</h3>
<pre><code>// C++ — O(n) time, O(min(n,charset)) space
int lengthOfLongestSubstring(string s) {
    unordered_map&lt;char, int&gt; lastSeen;
    int left = 0, maxLen = 0;
    for (int right = 0; right &lt; s.size(); right++) {
        if (lastSeen.count(s[right]) &amp;&amp; lastSeen[s[right]] &gt;= left) {
            left = lastSeen[s[right]] + 1;
        }
        lastSeen[s[right]] = right;
        maxLen = max(maxLen, right - left + 1);
    }
    return maxLen;
}</code></pre>

<h3>Longest Substring with At Most K Distinct Characters</h3>
<pre><code>// C++ — O(n) time, O(k) space
int longestKDistinct(string s, int k) {
    unordered_map&lt;char, int&gt; freq;
    int left = 0, maxLen = 0;
    for (int right = 0; right &lt; s.size(); right++) {
        freq[s[right]]++;
        while ((int)freq.size() &gt; k) {
            if (--freq[s[left]] == 0) freq.erase(s[left]);
            left++;
        }
        maxLen = max(maxLen, right - left + 1);
    }
    return maxLen;
}</code></pre>

<h2>4. Minimum Window Substring</h2>
<pre><code>// C++ — O(n + m) time, O(m) space
string minWindow(string s, string t) {
    unordered_map&lt;char, int&gt; need, window;
    for (char c : t) need[c]++;
    int have = 0, required = need.size();
    int left = 0, minLen = INT_MAX, minStart = 0;
    for (int right = 0; right &lt; s.size(); right++) {
        char c = s[right];
        window[c]++;
        if (need.count(c) &amp;&amp; window[c] == need[c]) have++;
        while (have == required) {
            if (right - left + 1 &lt; minLen) {
                minLen = right - left + 1;
                minStart = left;
            }
            char lc = s[left++];
            if (need.count(lc) &amp;&amp; window[lc] == need[lc]) have--;
            window[lc]--;
        }
    }
    return minLen == INT_MAX ? "" : s.substr(minStart, minLen);
}</code></pre>

<h2>Pattern Decision Table</h2>
<table>
<tr><th>Problem Type</th><th>Window Type</th><th>Key Data Structure</th><th>Time</th></tr>
<tr><td>Max/min of fixed subarray</td><td>Fixed</td><td>Running sum</td><td>O(n)</td></tr>
<tr><td>Shortest subarray with condition</td><td>Variable (shrink)</td><td>Running sum</td><td>O(n)</td></tr>
<tr><td>Longest substring with constraint</td><td>Variable (expand)</td><td>Hash map</td><td>O(n)</td></tr>
<tr><td>Find all anagrams</td><td>Fixed</td><td>Frequency array</td><td>O(n)</td></tr>
<tr><td>Min window substring</td><td>Variable (shrink)</td><td>Two hash maps</td><td>O(n+m)</td></tr>
<tr><td>Sliding window maximum</td><td>Fixed</td><td>Monotonic deque</td><td>O(n)</td></tr>
</table>

<div class="qa-block">
<div class="qa-q">Q: Find the longest substring with at most k distinct characters.</div>
<div class="qa-a">Use a variable-size sliding window with a hash map tracking character frequencies. Expand right pointer adding chars. When distinct count exceeds k, shrink from left removing chars (delete key when count hits 0). Track max length at each valid state. Time: O(n), Space: O(k).</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: How do you decide between fixed vs variable window?</div>
<div class="qa-a"><strong>Fixed window</strong>: when the problem specifies a window size k (e.g., "subarray of size k"). <strong>Variable window</strong>: when you need to find the longest/shortest subarray satisfying a condition. Variable windows use a while loop to shrink from the left when the constraint is violated.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: Find all anagrams of pattern p in string s.</div>
<div class="qa-a">Use a fixed-size window of length p.size(). Maintain a frequency array for p and for the current window. Slide the window across s; when frequencies match, record the start index. Use an array of size 26 instead of hash map for O(1) comparison. Time: O(n), Space: O(1).</div>
</div>

<div class="warning-note">Sliding window only works on problems with a <strong>monotonic</strong> property — adding elements either always helps or always hurts the constraint. If the constraint can flip arbitrarily, consider prefix sums or other approaches.</div>
`
  },

  {
    id: 'dsa-string-patterns',
    title: 'String Manipulation & Patterns',
    category: 'Arrays & Strings',
    starterCode: `// String Algorithms — JavaScript Implementations
// ================================================

// 1. Rabin-Karp String Matching
function rabinKarp(text, pattern) {
  const BASE = 31, MOD = 1e9 + 7;
  const n = text.length, m = pattern.length;
  if (m > n) return -1;

  let patHash = 0, textHash = 0, power = 1;
  for (let i = 0; i < m; i++) {
    patHash = (patHash * BASE + pattern.charCodeAt(i)) % MOD;
    textHash = (textHash * BASE + text.charCodeAt(i)) % MOD;
    if (i > 0) power = (power * BASE) % MOD;
  }

  for (let i = 0; i <= n - m; i++) {
    if (patHash === textHash && text.substring(i, i + m) === pattern) return i;
    if (i < n - m) {
      textHash = (textHash - text.charCodeAt(i) * power % MOD + MOD) % MOD;
      textHash = (textHash * BASE + text.charCodeAt(i + m)) % MOD;
    }
  }
  return -1;
}

console.log('=== Rabin-Karp ===');
console.log('Text: "hello world", Pattern: "world"');
console.log('Found at index:', rabinKarp('hello world', 'world'));

// 2. KMP Pattern Matching
function buildKMPTable(pattern) {
  const table = [0];
  let len = 0, i = 1;
  while (i < pattern.length) {
    if (pattern[i] === pattern[len]) {
      len++;
      table[i] = len;
      i++;
    } else if (len > 0) {
      len = table[len - 1];
    } else {
      table[i] = 0;
      i++;
    }
  }
  return table;
}

function kmpSearch(text, pattern) {
  const lps = buildKMPTable(pattern);
  let i = 0, j = 0;
  const results = [];
  while (i < text.length) {
    if (text[i] === pattern[j]) { i++; j++; }
    if (j === pattern.length) {
      results.push(i - j);
      j = lps[j - 1];
    } else if (i < text.length && text[i] !== pattern[j]) {
      j > 0 ? j = lps[j - 1] : i++;
    }
  }
  return results;
}

console.log('\\n=== KMP Search ===');
console.log('Text: "aabaacaadaabaaba", Pattern: "aaba"');
console.log('Found at indices:', kmpSearch('aabaacaadaabaaba', 'aaba'));

// 3. Longest Palindromic Substring (Expand Around Center)
function longestPalindrome(s) {
  let start = 0, maxLen = 1;
  function expand(l, r) {
    while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
    return r - l - 1;
  }
  for (let i = 0; i < s.length; i++) {
    const len1 = expand(i, i);     // odd length
    const len2 = expand(i, i + 1); // even length
    const len = Math.max(len1, len2);
    if (len > maxLen) {
      maxLen = len;
      start = i - Math.floor((len - 1) / 2);
    }
  }
  return s.substring(start, start + maxLen);
}

console.log('\\n=== Longest Palindromic Substring ===');
console.log('"babad" ->', longestPalindrome('babad'));
console.log('"cbbd" ->', longestPalindrome('cbbd'));

// 4. Check if string is rotation of another
function isRotation(s1, s2) {
  if (s1.length !== s2.length) return false;
  return (s1 + s1).includes(s2);
}

console.log('\\n=== String Rotation ===');
console.log('"waterbottle" is rotation of "erbottlewat":', isRotation('waterbottle', 'erbottlewat'));
`,
    content: `
<h1>String Manipulation &amp; Patterns</h1>
<p>String algorithms are a staple of coding interviews. This covers <strong>string hashing</strong>, <strong>pattern matching</strong>, <strong>palindromes</strong>, and C++ string utilities critical for SDE-2+ rounds.</p>

<h2>1. Rabin-Karp (Rolling Hash)</h2>
<p>Uses polynomial hashing to find pattern occurrences. Average O(n+m), worst O(nm).</p>
<pre><code>// C++ Rabin-Karp
int rabinKarp(const string&amp; text, const string&amp; pattern) {
    const long long BASE = 31, MOD = 1e9 + 7;
    int n = text.size(), m = pattern.size();
    if (m &gt; n) return -1;

    long long patHash = 0, textHash = 0, power = 1;
    for (int i = 0; i &lt; m; i++) {
        patHash = (patHash * BASE + pattern[i]) % MOD;
        textHash = (textHash * BASE + text[i]) % MOD;
        if (i &gt; 0) power = power * BASE % MOD;
    }

    for (int i = 0; i &lt;= n - m; i++) {
        if (patHash == textHash &amp;&amp; text.substr(i, m) == pattern)
            return i;
        if (i &lt; n - m) {
            textHash = ((textHash - text[i] * power % MOD + MOD) % MOD
                        * BASE + text[i + m]) % MOD;
        }
    }
    return -1;
}</code></pre>

<h2>2. KMP Algorithm</h2>
<p>Builds a <strong>Longest Proper Prefix which is also Suffix (LPS)</strong> table to avoid re-scanning characters. Guaranteed O(n+m).</p>
<pre><code>// C++ KMP
vector&lt;int&gt; buildLPS(const string&amp; pattern) {
    int m = pattern.size();
    vector&lt;int&gt; lps(m, 0);
    int len = 0, i = 1;
    while (i &lt; m) {
        if (pattern[i] == pattern[len]) {
            lps[i++] = ++len;
        } else if (len &gt; 0) {
            len = lps[len - 1]; // don't increment i
        } else {
            lps[i++] = 0;
        }
    }
    return lps;
}

vector&lt;int&gt; kmpSearch(const string&amp; text, const string&amp; pattern) {
    vector&lt;int&gt; lps = buildLPS(pattern);
    vector&lt;int&gt; results;
    int i = 0, j = 0;
    while (i &lt; (int)text.size()) {
        if (text[i] == pattern[j]) { i++; j++; }
        if (j == (int)pattern.size()) {
            results.push_back(i - j);
            j = lps[j - 1];
        } else if (i &lt; (int)text.size() &amp;&amp; text[i] != pattern[j]) {
            j &gt; 0 ? j = lps[j - 1] : i++;
        }
    }
    return results;
}

// LPS table construction visual:
// Pattern: "aabaaab"
// Index:    0 1 2 3 4 5 6
// LPS:     [0,1,0,1,2,2,3]</code></pre>

<h2>3. Palindrome Patterns</h2>
<h3>Expand Around Center — O(n&sup2;)</h3>
<pre><code>// C++
string longestPalindrome(string s) {
    int start = 0, maxLen = 1;
    auto expand = [&amp;](int l, int r) {
        while (l &gt;= 0 &amp;&amp; r &lt; (int)s.size() &amp;&amp; s[l] == s[r]) { l--; r++; }
        return r - l - 1;
    };
    for (int i = 0; i &lt; (int)s.size(); i++) {
        int len = max(expand(i, i), expand(i, i + 1));
        if (len &gt; maxLen) {
            maxLen = len;
            start = i - (len - 1) / 2;
        }
    }
    return s.substr(start, maxLen);
}</code></pre>

<h3>Manacher's Algorithm — O(n)</h3>
<pre><code>// C++ — Finds all palindromic substrings in O(n)
vector&lt;int&gt; manacher(const string&amp; s) {
    string t = "#";
    for (char c : s) { t += c; t += '#'; }
    int n = t.size();
    vector&lt;int&gt; p(n, 0);
    int center = 0, right = 0;
    for (int i = 0; i &lt; n; i++) {
        if (i &lt; right)
            p[i] = min(right - i, p[2 * center - i]);
        while (i - p[i] - 1 &gt;= 0 &amp;&amp; i + p[i] + 1 &lt; n
               &amp;&amp; t[i - p[i] - 1] == t[i + p[i] + 1])
            p[i]++;
        if (i + p[i] &gt; right) {
            center = i;
            right = i + p[i];
        }
    }
    return p; // p[i] = radius of palindrome centered at t[i]
}</code></pre>

<h2>4. Anagram Detection</h2>
<pre><code>// C++ — Check if two strings are anagrams: O(n)
bool isAnagram(const string&amp; s, const string&amp; t) {
    if (s.size() != t.size()) return false;
    int freq[26] = {};
    for (int i = 0; i &lt; (int)s.size(); i++) {
        freq[s[i] - 'a']++;
        freq[t[i] - 'a']--;
    }
    for (int f : freq) if (f != 0) return false;
    return true;
}</code></pre>

<h2>5. C++ String Utilities</h2>
<table>
<tr><th>Operation</th><th>Syntax</th><th>Complexity</th></tr>
<tr><td>Substring</td><td>s.substr(pos, len)</td><td>O(len)</td></tr>
<tr><td>Find</td><td>s.find("pat")</td><td>O(n*m)</td></tr>
<tr><td>Reverse find</td><td>s.rfind("pat")</td><td>O(n*m)</td></tr>
<tr><td>Compare</td><td>s.compare(t)</td><td>O(n)</td></tr>
<tr><td>Reverse</td><td>reverse(s.begin(), s.end())</td><td>O(n)</td></tr>
<tr><td>To int</td><td>stoi(s), stol(s), stoll(s)</td><td>O(n)</td></tr>
<tr><td>To string</td><td>to_string(num)</td><td>O(digits)</td></tr>
<tr><td>string_view</td><td>string_view sv = s;</td><td>O(1) — no copy</td></tr>
</table>

<h2>Algorithm Comparison</h2>
<table>
<tr><th>Algorithm</th><th>Time</th><th>Space</th><th>Best For</th></tr>
<tr><td>Brute Force</td><td>O(nm)</td><td>O(1)</td><td>Short patterns</td></tr>
<tr><td>Rabin-Karp</td><td>O(n+m) avg</td><td>O(1)</td><td>Multiple pattern search</td></tr>
<tr><td>KMP</td><td>O(n+m)</td><td>O(m)</td><td>Single pattern, guaranteed linear</td></tr>
<tr><td>Manacher</td><td>O(n)</td><td>O(n)</td><td>All palindromes</td></tr>
</table>

<div class="qa-block">
<div class="qa-q">Q: Check if one string is a rotation of another in O(n).</div>
<div class="qa-a">Concatenate s1 with itself: <code>s1 + s1</code>. If s2 is a rotation of s1, then s2 must be a substring of s1+s1. Check with <code>(s1+s1).find(s2) != string::npos</code>. Time: O(n) with KMP for the substring check. Space: O(n) for the concatenated string.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: When would you choose Rabin-Karp over KMP?</div>
<div class="qa-a">Rabin-Karp excels at <strong>multi-pattern search</strong> (search for multiple patterns simultaneously using the same hash). It is also simpler to implement for 2D pattern matching. KMP is preferred when you need <strong>guaranteed O(n+m) worst case</strong> for a single pattern, since Rabin-Karp can degrade to O(nm) with hash collisions.</div>
</div>
`
  },

  // ============================================================
  // TREES & GRAPHS
  // ============================================================
  {
    id: 'dsa-binary-trees',
    title: 'Binary Trees & BST',
    category: 'Trees & Graphs',
    starterCode: `// Binary Trees & BST — JavaScript Implementations
// ================================================

class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Build a sample tree:
//        4
//       / \\
//      2   6
//     / \\ / \\
//    1  3 5  7
const root = new TreeNode(4,
  new TreeNode(2, new TreeNode(1), new TreeNode(3)),
  new TreeNode(6, new TreeNode(5), new TreeNode(7))
);

// 1. Inorder Traversal (Iterative)
function inorder(root) {
  const result = [], stack = [];
  let curr = root;
  while (curr || stack.length) {
    while (curr) { stack.push(curr); curr = curr.left; }
    curr = stack.pop();
    result.push(curr.val);
    curr = curr.right;
  }
  return result;
}

console.log('Inorder:', inorder(root));

// 2. Level-Order (BFS)
function levelOrder(root) {
  if (!root) return [];
  const result = [], queue = [root];
  while (queue.length) {
    const level = [];
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}

console.log('Level order:', JSON.stringify(levelOrder(root)));

// 3. Height of tree
function height(root) {
  if (!root) return 0;
  return 1 + Math.max(height(root.left), height(root.right));
}
console.log('Height:', height(root));

// 4. Diameter of tree
function diameter(root) {
  let maxDiam = 0;
  function dfs(node) {
    if (!node) return 0;
    const left = dfs(node.left);
    const right = dfs(node.right);
    maxDiam = Math.max(maxDiam, left + right);
    return 1 + Math.max(left, right);
  }
  dfs(root);
  return maxDiam;
}
console.log('Diameter:', diameter(root));

// 5. Validate BST
function isValidBST(node, min = -Infinity, max = Infinity) {
  if (!node) return true;
  if (node.val <= min || node.val >= max) return false;
  return isValidBST(node.left, min, node.val) &&
         isValidBST(node.right, node.val, max);
}
console.log('Is valid BST:', isValidBST(root));

// 6. LCA in BST
function lcaBST(root, p, q) {
  if (p < root.val && q < root.val) return lcaBST(root.left, p, q);
  if (p > root.val && q > root.val) return lcaBST(root.right, p, q);
  return root.val;
}
console.log('LCA of 1,3:', lcaBST(root, 1, 3));
console.log('LCA of 1,5:', lcaBST(root, 1, 5));
`,
    content: `
<h1>Binary Trees &amp; BST</h1>
<p>Tree problems dominate coding interviews. This covers all essential <strong>traversals</strong>, <strong>BST operations</strong>, and classic problems that SDE-2/SDE-3 candidates must know.</p>

<h2>Tree Node Definition</h2>
<pre><code>// C++
struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

//        4
//       / \\
//      2   6
//     / \\ / \\
//    1  3 5  7</code></pre>

<h2>1. Traversals</h2>
<h3>Recursive</h3>
<pre><code>void inorder(TreeNode* root, vector&lt;int&gt;&amp; res) {
    if (!root) return;
    inorder(root-&gt;left, res);
    res.push_back(root-&gt;val);    // In: left, ROOT, right
    inorder(root-&gt;right, res);
}

void preorder(TreeNode* root, vector&lt;int&gt;&amp; res) {
    if (!root) return;
    res.push_back(root-&gt;val);    // Pre: ROOT, left, right
    preorder(root-&gt;left, res);
    preorder(root-&gt;right, res);
}

void postorder(TreeNode* root, vector&lt;int&gt;&amp; res) {
    if (!root) return;
    postorder(root-&gt;left, res);
    postorder(root-&gt;right, res);
    res.push_back(root-&gt;val);    // Post: left, right, ROOT
}</code></pre>

<h3>Iterative Inorder (using Stack)</h3>
<pre><code>vector&lt;int&gt; inorderIterative(TreeNode* root) {
    vector&lt;int&gt; result;
    stack&lt;TreeNode*&gt; stk;
    TreeNode* curr = root;
    while (curr || !stk.empty()) {
        while (curr) {
            stk.push(curr);
            curr = curr-&gt;left;
        }
        curr = stk.top(); stk.pop();
        result.push_back(curr-&gt;val);
        curr = curr-&gt;right;
    }
    return result;
}</code></pre>

<h3>Level-Order (BFS)</h3>
<pre><code>vector&lt;vector&lt;int&gt;&gt; levelOrder(TreeNode* root) {
    vector&lt;vector&lt;int&gt;&gt; result;
    if (!root) return result;
    queue&lt;TreeNode*&gt; q;
    q.push(root);
    while (!q.empty()) {
        int size = q.size();
        vector&lt;int&gt; level;
        for (int i = 0; i &lt; size; i++) {
            TreeNode* node = q.front(); q.pop();
            level.push_back(node-&gt;val);
            if (node-&gt;left) q.push(node-&gt;left);
            if (node-&gt;right) q.push(node-&gt;right);
        }
        result.push_back(level);
    }
    return result;
}</code></pre>

<h2>2. Morris Traversal — O(1) Space</h2>
<pre><code>// Inorder traversal without stack/recursion
vector&lt;int&gt; morrisInorder(TreeNode* root) {
    vector&lt;int&gt; result;
    TreeNode* curr = root;
    while (curr) {
        if (!curr-&gt;left) {
            result.push_back(curr-&gt;val);
            curr = curr-&gt;right;
        } else {
            TreeNode* pred = curr-&gt;left;
            while (pred-&gt;right &amp;&amp; pred-&gt;right != curr)
                pred = pred-&gt;right;
            if (!pred-&gt;right) {
                pred-&gt;right = curr;  // create thread
                curr = curr-&gt;left;
            } else {
                pred-&gt;right = nullptr; // remove thread
                result.push_back(curr-&gt;val);
                curr = curr-&gt;right;
            }
        }
    }
    return result;
}</code></pre>

<h2>3. BST Operations</h2>
<pre><code>// Validate BST — O(n) time
bool isValidBST(TreeNode* root, long minVal = LONG_MIN, long maxVal = LONG_MAX) {
    if (!root) return true;
    if (root-&gt;val &lt;= minVal || root-&gt;val &gt;= maxVal) return false;
    return isValidBST(root-&gt;left, minVal, root-&gt;val) &amp;&amp;
           isValidBST(root-&gt;right, root-&gt;val, maxVal);
}

// BST Insert — O(h)
TreeNode* insert(TreeNode* root, int val) {
    if (!root) return new TreeNode(val);
    if (val &lt; root-&gt;val) root-&gt;left = insert(root-&gt;left, val);
    else root-&gt;right = insert(root-&gt;right, val);
    return root;
}

// BST Delete — O(h)
TreeNode* deleteNode(TreeNode* root, int key) {
    if (!root) return nullptr;
    if (key &lt; root-&gt;val) root-&gt;left = deleteNode(root-&gt;left, key);
    else if (key &gt; root-&gt;val) root-&gt;right = deleteNode(root-&gt;right, key);
    else {
        if (!root-&gt;left) return root-&gt;right;
        if (!root-&gt;right) return root-&gt;left;
        TreeNode* succ = root-&gt;right;
        while (succ-&gt;left) succ = succ-&gt;left;
        root-&gt;val = succ-&gt;val;
        root-&gt;right = deleteNode(root-&gt;right, succ-&gt;val);
    }
    return root;
}</code></pre>

<h2>4. Classic Problems</h2>
<pre><code>// Diameter of Binary Tree — O(n)
int diameter(TreeNode* root) {
    int maxDiam = 0;
    function&lt;int(TreeNode*)&gt; dfs = [&amp;](TreeNode* node) -&gt; int {
        if (!node) return 0;
        int left = dfs(node-&gt;left);
        int right = dfs(node-&gt;right);
        maxDiam = max(maxDiam, left + right);
        return 1 + max(left, right);
    };
    dfs(root);
    return maxDiam;
}

// LCA of Binary Tree — O(n)
TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
    if (!root || root == p || root == q) return root;
    TreeNode* left = lowestCommonAncestor(root-&gt;left, p, q);
    TreeNode* right = lowestCommonAncestor(root-&gt;right, p, q);
    if (left &amp;&amp; right) return root;
    return left ? left : right;
}

// Serialize / Deserialize (Preorder)
string serialize(TreeNode* root) {
    if (!root) return "#";
    return to_string(root-&gt;val) + "," + serialize(root-&gt;left) + "," + serialize(root-&gt;right);
}</code></pre>

<h2>Complexity Table</h2>
<table>
<tr><th>Operation</th><th>BST Average</th><th>BST Worst</th><th>Balanced BST</th></tr>
<tr><td>Search</td><td>O(log n)</td><td>O(n)</td><td>O(log n)</td></tr>
<tr><td>Insert</td><td>O(log n)</td><td>O(n)</td><td>O(log n)</td></tr>
<tr><td>Delete</td><td>O(log n)</td><td>O(n)</td><td>O(log n)</td></tr>
<tr><td>Traversal</td><td>O(n)</td><td>O(n)</td><td>O(n)</td></tr>
<tr><td>LCA</td><td>O(log n)</td><td>O(n)</td><td>O(log n)</td></tr>
<tr><td>Morris Traversal</td><td colspan="3">O(n) time, O(1) space</td></tr>
</table>

<div class="qa-block">
<div class="qa-q">Q: Find the diameter of a binary tree.</div>
<div class="qa-a">The diameter is the longest path between any two nodes (measured in edges). For each node, the path through it equals left_height + right_height. Use a DFS that returns the height and updates a global max diameter. Time: O(n), Space: O(h) for recursion stack.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: What is Morris Traversal and when would you use it?</div>
<div class="qa-a">Morris traversal performs inorder traversal using O(1) extra space (no stack/recursion) by creating temporary "threads" — the rightmost node of the left subtree points back to the current node. It temporarily modifies the tree but restores it. Use when memory is extremely constrained.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: How do you serialize and deserialize a binary tree?</div>
<div class="qa-a">Use <strong>preorder traversal</strong> with a null marker (e.g., "#"). Serialize: visit root, then left, then right, writing "#" for null. Deserialize: read values in order, recursively build left then right subtrees. This uniquely reconstructs the tree. Time: O(n).</div>
</div>
`
  },

  {
    id: 'dsa-graphs',
    title: 'Graph Algorithms',
    category: 'Trees & Graphs',
    starterCode: `// Graph Algorithms — JavaScript Implementations
// ==============================================

// Graph representation: Adjacency List
class Graph {
  constructor(n) {
    this.n = n;
    this.adj = Array.from({length: n}, () => []);
  }
  addEdge(u, v, w = 1) {
    this.adj[u].push({to: v, weight: w});
  }
  addUndirected(u, v, w = 1) {
    this.adj[u].push({to: v, weight: w});
    this.adj[v].push({to: u, weight: w});
  }
}

// 1. BFS
function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  const order = [];
  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    for (const {to} of graph.adj[u]) {
      if (!visited.has(to)) {
        visited.add(to);
        queue.push(to);
      }
    }
  }
  return order;
}

// 2. DFS
function dfs(graph, start) {
  const visited = new Set();
  const order = [];
  function visit(u) {
    visited.add(u);
    order.push(u);
    for (const {to} of graph.adj[u]) {
      if (!visited.has(to)) visit(to);
    }
  }
  visit(start);
  return order;
}

// Build sample graph
//   0 --- 1 --- 3
//   |     |
//   2 --- 4
const g = new Graph(5);
g.addUndirected(0, 1); g.addUndirected(0, 2);
g.addUndirected(1, 3); g.addUndirected(1, 4);
g.addUndirected(2, 4);

console.log('BFS from 0:', bfs(g, 0));
console.log('DFS from 0:', dfs(g, 0));

// 3. Topological Sort (Kahn's BFS)
function topoSort(n, edges) {
  const adj = Array.from({length: n}, () => []);
  const indegree = new Array(n).fill(0);
  for (const [u, v] of edges) {
    adj[u].push(v);
    indegree[v]++;
  }
  const queue = [];
  for (let i = 0; i < n; i++) if (indegree[i] === 0) queue.push(i);
  const result = [];
  while (queue.length) {
    const u = queue.shift();
    result.push(u);
    for (const v of adj[u]) {
      if (--indegree[v] === 0) queue.push(v);
    }
  }
  return result.length === n ? result : []; // empty = cycle
}

console.log('\\nTopo sort (courses 0->1, 0->2, 1->3, 2->3):');
console.log(topoSort(4, [[0,1],[0,2],[1,3],[2,3]]));

// 4. Dijkstra's Shortest Path
function dijkstra(graph, start) {
  const dist = new Array(graph.n).fill(Infinity);
  dist[start] = 0;
  // Simple priority queue using sorted array
  const pq = [[0, start]]; // [dist, node]
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift();
    if (d > dist[u]) continue;
    for (const {to, weight} of graph.adj[u]) {
      if (dist[u] + weight < dist[to]) {
        dist[to] = dist[u] + weight;
        pq.push([dist[to], to]);
      }
    }
  }
  return dist;
}

const wg = new Graph(4);
wg.addUndirected(0, 1, 1); wg.addUndirected(0, 2, 4);
wg.addUndirected(1, 2, 2); wg.addUndirected(1, 3, 6);
wg.addUndirected(2, 3, 3);

console.log('\\nDijkstra from 0:', dijkstra(wg, 0));

// 5. Union-Find
class UnionFind {
  constructor(n) {
    this.parent = Array.from({length: n}, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }
  find(x) {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }
  union(x, y) {
    const px = this.find(x), py = this.find(y);
    if (px === py) return false;
    if (this.rank[px] < this.rank[py]) this.parent[px] = py;
    else if (this.rank[px] > this.rank[py]) this.parent[py] = px;
    else { this.parent[py] = px; this.rank[px]++; }
    return true;
  }
}

const uf = new UnionFind(5);
uf.union(0, 1); uf.union(2, 3); uf.union(1, 3);
console.log('\\nUnion-Find: 0 and 3 connected?', uf.find(0) === uf.find(3));
console.log('0 and 4 connected?', uf.find(0) === uf.find(4));
`,
    content: `
<h1>Graph Algorithms</h1>
<p>Graphs appear in almost every SDE-2+ interview. Master these <strong>representations</strong>, <strong>traversals</strong>, and <strong>classic algorithms</strong>.</p>

<h2>Graph Representations</h2>
<pre><code>// Adjacency List (most common in interviews) — C++
vector&lt;vector&lt;int&gt;&gt; adj(n);  // unweighted
vector&lt;vector&lt;pair&lt;int,int&gt;&gt;&gt; adj(n);  // weighted {to, weight}

// Adjacency Matrix
vector&lt;vector&lt;int&gt;&gt; mat(n, vector&lt;int&gt;(n, 0));

// Edge List
vector&lt;tuple&lt;int,int,int&gt;&gt; edges;  // {u, v, weight}

// Comparison:
// Adj List:   Space O(V+E), Check edge O(degree), Iterate neighbors O(degree)
// Adj Matrix: Space O(V^2), Check edge O(1), Iterate neighbors O(V)</code></pre>

<h2>BFS and DFS</h2>
<pre><code>// BFS — O(V+E) time, O(V) space
vector&lt;int&gt; bfs(int start, vector&lt;vector&lt;int&gt;&gt;&amp; adj) {
    int n = adj.size();
    vector&lt;bool&gt; visited(n, false);
    queue&lt;int&gt; q;
    q.push(start);
    visited[start] = true;
    vector&lt;int&gt; order;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);
        for (int v : adj[u]) {
            if (!visited[v]) {
                visited[v] = true;
                q.push(v);
            }
        }
    }
    return order;
}

// DFS — O(V+E) time, O(V) space
void dfs(int u, vector&lt;vector&lt;int&gt;&gt;&amp; adj, vector&lt;bool&gt;&amp; visited) {
    visited[u] = true;
    for (int v : adj[u]) {
        if (!visited[v]) dfs(v, adj, visited);
    }
}</code></pre>

<h2>Topological Sort</h2>
<pre><code>// Kahn's Algorithm (BFS) — O(V+E)
vector&lt;int&gt; topoSortBFS(int n, vector&lt;vector&lt;int&gt;&gt;&amp; adj) {
    vector&lt;int&gt; indegree(n, 0);
    for (int u = 0; u &lt; n; u++)
        for (int v : adj[u]) indegree[v]++;

    queue&lt;int&gt; q;
    for (int i = 0; i &lt; n; i++)
        if (indegree[i] == 0) q.push(i);

    vector&lt;int&gt; result;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        result.push_back(u);
        for (int v : adj[u])
            if (--indegree[v] == 0) q.push(v);
    }
    return result.size() == n ? result : vector&lt;int&gt;(); // empty = cycle
}

// DFS-based Topological Sort
void topoSortDFS(int u, vector&lt;vector&lt;int&gt;&gt;&amp; adj, vector&lt;bool&gt;&amp; visited,
                  stack&lt;int&gt;&amp; stk) {
    visited[u] = true;
    for (int v : adj[u])
        if (!visited[v]) topoSortDFS(v, adj, visited, stk);
    stk.push(u); // add AFTER all descendants
}</code></pre>

<h2>Cycle Detection</h2>
<pre><code>// Directed Graph — DFS with coloring: O(V+E)
// WHITE=0, GRAY=1, BLACK=2
bool hasCycleDFS(int u, vector&lt;vector&lt;int&gt;&gt;&amp; adj, vector&lt;int&gt;&amp; color) {
    color[u] = 1; // GRAY (in progress)
    for (int v : adj[u]) {
        if (color[v] == 1) return true;  // back edge = cycle
        if (color[v] == 0 &amp;&amp; hasCycleDFS(v, adj, color)) return true;
    }
    color[u] = 2; // BLACK (done)
    return false;
}

// Undirected Graph — DFS: O(V+E)
bool hasCycleUndirected(int u, int parent, vector&lt;vector&lt;int&gt;&gt;&amp; adj,
                         vector&lt;bool&gt;&amp; visited) {
    visited[u] = true;
    for (int v : adj[u]) {
        if (!visited[v]) {
            if (hasCycleUndirected(v, u, adj, visited)) return true;
        } else if (v != parent) return true; // visited &amp; not parent = cycle
    }
    return false;
}</code></pre>

<h2>Shortest Path Algorithms</h2>
<pre><code>// Dijkstra's — O((V+E) log V) with priority queue
vector&lt;int&gt; dijkstra(int src, vector&lt;vector&lt;pair&lt;int,int&gt;&gt;&gt;&amp; adj) {
    int n = adj.size();
    vector&lt;int&gt; dist(n, INT_MAX);
    priority_queue&lt;pair&lt;int,int&gt;, vector&lt;pair&lt;int,int&gt;&gt;,
                   greater&lt;pair&lt;int,int&gt;&gt;&gt; pq;
    dist[src] = 0;
    pq.push({0, src});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d &gt; dist[u]) continue;
        for (auto [v, w] : adj[u]) {
            if (dist[u] + w &lt; dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}

// Bellman-Ford — O(VE), handles negative weights
vector&lt;int&gt; bellmanFord(int src, int n,
                         vector&lt;tuple&lt;int,int,int&gt;&gt;&amp; edges) {
    vector&lt;int&gt; dist(n, INT_MAX);
    dist[src] = 0;
    for (int i = 0; i &lt; n - 1; i++) {
        for (auto [u, v, w] : edges) {
            if (dist[u] != INT_MAX &amp;&amp; dist[u] + w &lt; dist[v])
                dist[v] = dist[u] + w;
        }
    }
    // Check negative cycle
    for (auto [u, v, w] : edges)
        if (dist[u] != INT_MAX &amp;&amp; dist[u] + w &lt; dist[v])
            return {}; // negative cycle exists
    return dist;
}</code></pre>

<h2>Union-Find (Disjoint Set)</h2>
<pre><code>class UnionFind {
    vector&lt;int&gt; parent, rank_;
public:
    UnionFind(int n) : parent(n), rank_(n, 0) {
        iota(parent.begin(), parent.end(), 0);
    }
    int find(int x) {
        if (parent[x] != x)
            parent[x] = find(parent[x]); // path compression
        return parent[x];
    }
    bool unite(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;
        if (rank_[px] &lt; rank_[py]) swap(px, py);
        parent[py] = px;
        if (rank_[px] == rank_[py]) rank_[px]++;
        return true;
    }
    // Amortized O(alpha(n)) per operation (nearly O(1))
};</code></pre>

<h2>Algorithm Comparison</h2>
<table>
<tr><th>Algorithm</th><th>Time</th><th>Space</th><th>Use Case</th></tr>
<tr><td>BFS</td><td>O(V+E)</td><td>O(V)</td><td>Shortest path (unweighted), level-order</td></tr>
<tr><td>DFS</td><td>O(V+E)</td><td>O(V)</td><td>Connectivity, cycle detection, topo sort</td></tr>
<tr><td>Dijkstra</td><td>O((V+E)log V)</td><td>O(V)</td><td>Shortest path, non-negative weights</td></tr>
<tr><td>Bellman-Ford</td><td>O(VE)</td><td>O(V)</td><td>Negative weights, negative cycle detection</td></tr>
<tr><td>Floyd-Warshall</td><td>O(V&sup3;)</td><td>O(V&sup2;)</td><td>All-pairs shortest path</td></tr>
<tr><td>Kruskal</td><td>O(E log E)</td><td>O(V)</td><td>MST (sparse graphs)</td></tr>
<tr><td>Prim</td><td>O((V+E)log V)</td><td>O(V)</td><td>MST (dense graphs)</td></tr>
<tr><td>Union-Find</td><td>O(alpha(n))</td><td>O(V)</td><td>Dynamic connectivity, Kruskal's</td></tr>
</table>

<div class="qa-block">
<div class="qa-q">Q: Detect a cycle in a directed graph.</div>
<div class="qa-a">Use <strong>DFS with 3-color marking</strong>: WHITE (unvisited), GRAY (in current DFS path), BLACK (fully processed). If during DFS you encounter a GRAY node, there is a back edge and hence a cycle. Alternatively, use <strong>Kahn's topological sort</strong> — if the result has fewer than V nodes, a cycle exists. Both are O(V+E).</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: Find shortest path in a weighted graph with negative edges.</div>
<div class="qa-a">Use <strong>Bellman-Ford</strong>. Dijkstra fails with negative weights because it greedily finalizes distances. Bellman-Ford relaxes all edges V-1 times, handling negative weights correctly. An extra V-th iteration detects negative cycles. Time: O(VE). For all-pairs with negative weights, use Floyd-Warshall O(V&sup3;).</div>
</div>

<div class="warning-note">Dijkstra does NOT work with negative edge weights. Always use Bellman-Ford or Floyd-Warshall when negative weights are present.</div>
`
  },

  {
    id: 'dsa-advanced-graphs',
    title: 'Advanced Graph Problems',
    category: 'Trees & Graphs',
    starterCode: `// Advanced Graph Problems — JavaScript Implementations
// ====================================================

// 1. Number of Islands (Grid DFS)
function numIslands(grid) {
  if (!grid.length) return 0;
  const rows = grid.length, cols = grid[0].length;
  let count = 0;

  function dfs(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] === '0') return;
    grid[r][c] = '0'; // mark visited
    dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        count++;
        dfs(r, c);
      }
    }
  }
  return count;
}

const grid = [
  ['1','1','0','0','0'],
  ['1','1','0','0','0'],
  ['0','0','1','0','0'],
  ['0','0','0','1','1']
];
console.log('Number of islands:', numIslands(grid.map(r => [...r])));

// 2. Word Ladder (BFS on implicit graph)
function wordLadder(beginWord, endWord, wordList) {
  const wordSet = new Set(wordList);
  if (!wordSet.has(endWord)) return 0;
  const queue = [[beginWord, 1]];
  const visited = new Set([beginWord]);

  while (queue.length) {
    const [word, steps] = queue.shift();
    if (word === endWord) return steps;
    for (let i = 0; i < word.length; i++) {
      for (let c = 97; c <= 122; c++) {
        const next = word.slice(0, i) + String.fromCharCode(c) + word.slice(i + 1);
        if (wordSet.has(next) && !visited.has(next)) {
          visited.add(next);
          queue.push([next, steps + 1]);
        }
      }
    }
  }
  return 0;
}

console.log('\\nWord Ladder: hit -> cog');
console.log('Steps:', wordLadder('hit', 'cog', ['hot','dot','dog','lot','log','cog']));

// 3. Course Schedule (Cycle Detection = Topo Sort)
function canFinish(numCourses, prerequisites) {
  const adj = Array.from({length: numCourses}, () => []);
  const indegree = new Array(numCourses).fill(0);
  for (const [course, prereq] of prerequisites) {
    adj[prereq].push(course);
    indegree[course]++;
  }
  const queue = [];
  for (let i = 0; i < numCourses; i++)
    if (indegree[i] === 0) queue.push(i);
  let count = 0;
  while (queue.length) {
    const u = queue.shift();
    count++;
    for (const v of adj[u])
      if (--indegree[v] === 0) queue.push(v);
  }
  return count === numCourses;
}

console.log('\\nCourse Schedule: 4 courses, [[1,0],[2,0],[3,1],[3,2]]');
console.log('Can finish:', canFinish(4, [[1,0],[2,0],[3,1],[3,2]]));
console.log('With cycle [[0,1],[1,0]]:', canFinish(2, [[0,1],[1,0]]));

// 4. Bipartite Check (2-coloring BFS)
function isBipartite(n, edges) {
  const adj = Array.from({length: n}, () => []);
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
  const color = new Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    if (color[i] !== -1) continue;
    color[i] = 0;
    const queue = [i];
    while (queue.length) {
      const u = queue.shift();
      for (const v of adj[u]) {
        if (color[v] === -1) {
          color[v] = 1 - color[u];
          queue.push(v);
        } else if (color[v] === color[u]) return false;
      }
    }
  }
  return true;
}

console.log('\\nBipartite check (0-1, 1-2, 2-3, 3-0):', isBipartite(4, [[0,1],[1,2],[2,3],[3,0]]));
console.log('Bipartite (0-1, 1-2, 2-0):', isBipartite(3, [[0,1],[1,2],[2,0]]));
`,
    content: `
<h1>Advanced Graph Problems</h1>
<p>These are the most frequently asked graph problems in SDE-2/SDE-3 coding rounds. Each combines graph theory with a specific algorithmic technique.</p>

<h2>1. Number of Islands (Grid Traversal)</h2>
<pre><code>// C++ — DFS on grid, O(M*N) time, O(M*N) stack space
int numIslands(vector&lt;vector&lt;char&gt;&gt;&amp; grid) {
    int rows = grid.size(), cols = grid[0].size();
    int count = 0;
    int dx[] = {1, -1, 0, 0};
    int dy[] = {0, 0, 1, -1};

    function&lt;void(int,int)&gt; dfs = [&amp;](int r, int c) {
        if (r &lt; 0 || r &gt;= rows || c &lt; 0 || c &gt;= cols
            || grid[r][c] == '0') return;
        grid[r][c] = '0';
        for (int d = 0; d &lt; 4; d++)
            dfs(r + dx[d], c + dy[d]);
    };

    for (int r = 0; r &lt; rows; r++)
        for (int c = 0; c &lt; cols; c++)
            if (grid[r][c] == '1') { count++; dfs(r, c); }
    return count;
}

// Grid visualization:
// 1 1 0 0 0
// 1 1 0 0 0     Island 1: top-left 2x2
// 0 0 1 0 0     Island 2: center
// 0 0 0 1 1     Island 3: bottom-right
// Answer: 3 islands</code></pre>

<h2>2. Word Ladder (BFS on Implicit Graph)</h2>
<pre><code>// C++ — BFS, O(M^2 * N) where M=word length, N=word count
int ladderLength(string beginWord, string endWord,
                 vector&lt;string&gt;&amp; wordList) {
    unordered_set&lt;string&gt; wordSet(wordList.begin(), wordList.end());
    if (!wordSet.count(endWord)) return 0;

    queue&lt;pair&lt;string, int&gt;&gt; q;
    q.push({beginWord, 1});
    unordered_set&lt;string&gt; visited;
    visited.insert(beginWord);

    while (!q.empty()) {
        auto [word, steps] = q.front(); q.pop();
        if (word == endWord) return steps;
        for (int i = 0; i &lt; (int)word.size(); i++) {
            char original = word[i];
            for (char c = 'a'; c &lt;= 'z'; c++) {
                word[i] = c;
                if (wordSet.count(word) &amp;&amp; !visited.count(word)) {
                    visited.insert(word);
                    q.push({word, steps + 1});
                }
            }
            word[i] = original;
        }
    }
    return 0;
}

// hit -&gt; hot -&gt; dot -&gt; dog -&gt; cog = 5 transformations</code></pre>

<h2>3. Course Schedule (Topological Sort)</h2>
<pre><code>// C++ — Kahn's, O(V+E)
bool canFinish(int numCourses, vector&lt;vector&lt;int&gt;&gt;&amp; prerequisites) {
    vector&lt;vector&lt;int&gt;&gt; adj(numCourses);
    vector&lt;int&gt; indegree(numCourses, 0);
    for (auto&amp; p : prerequisites) {
        adj[p[1]].push_back(p[0]);
        indegree[p[0]]++;
    }
    queue&lt;int&gt; q;
    for (int i = 0; i &lt; numCourses; i++)
        if (indegree[i] == 0) q.push(i);
    int count = 0;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        count++;
        for (int v : adj[u])
            if (--indegree[v] == 0) q.push(v);
    }
    return count == numCourses; // false if cycle
}</code></pre>

<h2>4. Clone Graph</h2>
<pre><code>// C++ — DFS + Hash Map, O(V+E)
class Node {
public:
    int val;
    vector&lt;Node*&gt; neighbors;
    Node(int v) : val(v) {}
};

Node* cloneGraph(Node* node) {
    if (!node) return nullptr;
    unordered_map&lt;Node*, Node*&gt; cloned;

    function&lt;Node*(Node*)&gt; dfs = [&amp;](Node* n) -&gt; Node* {
        if (cloned.count(n)) return cloned[n];
        Node* copy = new Node(n-&gt;val);
        cloned[n] = copy;
        for (Node* neighbor : n-&gt;neighbors)
            copy-&gt;neighbors.push_back(dfs(neighbor));
        return copy;
    };
    return dfs(node);
}</code></pre>

<h2>5. Bipartite Graph Check</h2>
<pre><code>// C++ — BFS 2-coloring, O(V+E)
bool isBipartite(vector&lt;vector&lt;int&gt;&gt;&amp; adj) {
    int n = adj.size();
    vector&lt;int&gt; color(n, -1);
    for (int i = 0; i &lt; n; i++) {
        if (color[i] != -1) continue;
        queue&lt;int&gt; q;
        q.push(i);
        color[i] = 0;
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int v : adj[u]) {
                if (color[v] == -1) {
                    color[v] = 1 - color[u];
                    q.push(v);
                } else if (color[v] == color[u])
                    return false; // odd cycle
            }
        }
    }
    return true;
}</code></pre>

<h2>6. Strongly Connected Components (Kosaraju's)</h2>
<pre><code>// C++ — Two-pass DFS, O(V+E)
vector&lt;vector&lt;int&gt;&gt; kosaraju(int n, vector&lt;vector&lt;int&gt;&gt;&amp; adj) {
    // Pass 1: DFS and record finish order
    vector&lt;bool&gt; visited(n, false);
    stack&lt;int&gt; order;
    function&lt;void(int)&gt; dfs1 = [&amp;](int u) {
        visited[u] = true;
        for (int v : adj[u]) if (!visited[v]) dfs1(v);
        order.push(u);
    };
    for (int i = 0; i &lt; n; i++) if (!visited[i]) dfs1(i);

    // Build reverse graph
    vector&lt;vector&lt;int&gt;&gt; radj(n);
    for (int u = 0; u &lt; n; u++)
        for (int v : adj[u]) radj[v].push_back(u);

    // Pass 2: DFS on reverse graph in finish order
    fill(visited.begin(), visited.end(), false);
    vector&lt;vector&lt;int&gt;&gt; sccs;
    function&lt;void(int, vector&lt;int&gt;&amp;)&gt; dfs2 = [&amp;](int u, vector&lt;int&gt;&amp; comp) {
        visited[u] = true;
        comp.push_back(u);
        for (int v : radj[u]) if (!visited[v]) dfs2(v, comp);
    };
    while (!order.empty()) {
        int u = order.top(); order.pop();
        if (!visited[u]) {
            sccs.push_back({});
            dfs2(u, sccs.back());
        }
    }
    return sccs;
}</code></pre>

<h2>Problem Patterns</h2>
<table>
<tr><th>Problem</th><th>Technique</th><th>Time</th></tr>
<tr><td>Number of Islands</td><td>Grid DFS/BFS</td><td>O(M*N)</td></tr>
<tr><td>Word Ladder</td><td>BFS implicit graph</td><td>O(M&sup2;*N)</td></tr>
<tr><td>Course Schedule</td><td>Topological sort</td><td>O(V+E)</td></tr>
<tr><td>Clone Graph</td><td>DFS + hash map</td><td>O(V+E)</td></tr>
<tr><td>Network Delay</td><td>Dijkstra</td><td>O((V+E)log V)</td></tr>
<tr><td>Bipartite Check</td><td>BFS 2-coloring</td><td>O(V+E)</td></tr>
<tr><td>SCC</td><td>Kosaraju/Tarjan</td><td>O(V+E)</td></tr>
</table>

<div class="qa-block">
<div class="qa-q">Q: Find the number of connected components in an undirected graph.</div>
<div class="qa-a">Three approaches: (1) <strong>DFS/BFS</strong>: loop through all nodes, start DFS/BFS from unvisited nodes, count the number of traversals initiated. (2) <strong>Union-Find</strong>: union all edges, count distinct parents. Both O(V+E). Union-Find is better when edges arrive dynamically.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: When do you use BFS vs DFS for graph problems?</div>
<div class="qa-a"><strong>BFS</strong>: shortest path in unweighted graphs, level-by-level exploration, word ladder. <strong>DFS</strong>: cycle detection, topological sort, connected components, path finding, backtracking. For grid problems, both work; DFS is simpler to code recursively, BFS avoids stack overflow on large grids.</div>
</div>
`
  },

  // ============================================================
  // DP & GREEDY
  // ============================================================
  {
    id: 'dsa-dp-patterns',
    title: 'Dynamic Programming Patterns',
    category: 'DP & Greedy',
    starterCode: `// Dynamic Programming Patterns — JavaScript Implementations
// =========================================================

// Framework: State -> Transition -> Base Case -> Order

// 1. Climbing Stairs (1D DP)
function climbStairs(n) {
  if (n <= 2) return n;
  let prev2 = 1, prev1 = 2;
  for (let i = 3; i <= n; i++) {
    const curr = prev1 + prev2;
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}
console.log('Climb stairs (n=5):', climbStairs(5));

// 2. Coin Change (Unbounded Knapsack)
function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i && dp[i - coin] + 1 < dp[i]) {
        dp[i] = dp[i - coin] + 1;
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
console.log('\\nCoin change [1,3,4], amount=6:', coinChange([1,3,4], 6));

// 3. Longest Common Subsequence (2D DP)
function lcs(s1, s2) {
  const m = s1.length, n = s2.length;
  const dp = Array.from({length: m + 1}, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i-1] === s2[j-1]) dp[i][j] = dp[i-1][j-1] + 1;
      else dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
    }
  }
  return dp[m][n];
}
console.log('\\nLCS of "abcde" and "ace":', lcs('abcde', 'ace'));

// 4. 0/1 Knapsack
function knapsack01(weights, values, capacity) {
  const n = weights.length;
  const dp = Array.from({length: n + 1}, () => new Array(capacity + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      dp[i][w] = dp[i-1][w]; // don't take
      if (weights[i-1] <= w) {
        dp[i][w] = Math.max(dp[i][w], dp[i-1][w - weights[i-1]] + values[i-1]);
      }
    }
  }
  return dp[n][capacity];
}
console.log('\\n0/1 Knapsack w=[1,2,3], v=[6,10,12], cap=5:', knapsack01([1,2,3],[6,10,12],5));

// 5. Edit Distance
function editDistance(s1, s2) {
  const m = s1.length, n = s2.length;
  const dp = Array.from({length: m + 1}, (_, i) =>
    Array.from({length: n + 1}, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i-1] === s2[j-1]) dp[i][j] = dp[i-1][j-1];
      else dp[i][j] = 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}
console.log('\\nEdit distance "horse" -> "ros":', editDistance('horse', 'ros'));

// 6. Buy/Sell Stock with Cooldown (State Machine DP)
function maxProfitCooldown(prices) {
  let held = -Infinity, sold = 0, rest = 0;
  for (const p of prices) {
    const prevHeld = held, prevSold = sold, prevRest = rest;
    held = Math.max(prevHeld, prevRest - p);   // hold or buy
    sold = prevHeld + p;                        // sell
    rest = Math.max(prevRest, prevSold);        // rest or after cooldown
  }
  return Math.max(sold, rest);
}
console.log('\\nBuy/Sell with cooldown [1,2,3,0,2]:', maxProfitCooldown([1,2,3,0,2]));
`,
    content: `
<h1>Dynamic Programming Patterns</h1>
<p>DP is the most feared interview topic. The key insight: <strong>break it into state, transition, base case, and computation order</strong>. Every DP problem follows this framework.</p>

<div class="warning-note">DP Framework: (1) Define STATE — what variables describe a subproblem. (2) TRANSITION — how states relate. (3) BASE CASE. (4) ORDER — ensure dependencies computed first.</div>

<h2>Top-Down vs Bottom-Up</h2>
<pre><code>// Top-Down (Memoization) — Recursive + cache
int fib(int n, vector&lt;int&gt;&amp; memo) {
    if (n &lt;= 1) return n;
    if (memo[n] != -1) return memo[n];
    return memo[n] = fib(n-1, memo) + fib(n-2, memo);
}

// Bottom-Up (Tabulation) — Iterative
int fib(int n) {
    if (n &lt;= 1) return n;
    int prev2 = 0, prev1 = 1;
    for (int i = 2; i &lt;= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
// Top-down: easier to write, risk of stack overflow
// Bottom-up: better cache performance, space optimization possible</code></pre>

<h2>1. 1D DP</h2>
<h3>House Robber</h3>
<pre><code>// C++ — O(n) time, O(1) space
int rob(vector&lt;int&gt;&amp; nums) {
    int prev2 = 0, prev1 = 0;
    for (int num : nums) {
        int curr = max(prev1, prev2 + num);
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
// State: dp[i] = max money robbing houses 0..i
// Transition: dp[i] = max(dp[i-1], dp[i-2] + nums[i])</code></pre>

<h2>2. 2D DP</h2>
<h3>Longest Common Subsequence</h3>
<pre><code>// C++ — O(mn) time, O(mn) space (optimizable to O(n))
int lcs(string&amp; s1, string&amp; s2) {
    int m = s1.size(), n = s2.size();
    vector&lt;vector&lt;int&gt;&gt; dp(m + 1, vector&lt;int&gt;(n + 1, 0));
    for (int i = 1; i &lt;= m; i++)
        for (int j = 1; j &lt;= n; j++)
            dp[i][j] = (s1[i-1] == s2[j-1])
                ? dp[i-1][j-1] + 1
                : max(dp[i-1][j], dp[i][j-1]);
    return dp[m][n];
}
// State: dp[i][j] = LCS of s1[0..i-1] and s2[0..j-1]
// Transition: match -> dp[i-1][j-1]+1, else max of skip either</code></pre>

<h3>Edit Distance</h3>
<pre><code>// C++ — O(mn) time
int editDistance(string&amp; s1, string&amp; s2) {
    int m = s1.size(), n = s2.size();
    vector&lt;vector&lt;int&gt;&gt; dp(m + 1, vector&lt;int&gt;(n + 1, 0));
    for (int i = 0; i &lt;= m; i++) dp[i][0] = i;
    for (int j = 0; j &lt;= n; j++) dp[0][j] = j;
    for (int i = 1; i &lt;= m; i++)
        for (int j = 1; j &lt;= n; j++)
            dp[i][j] = (s1[i-1] == s2[j-1])
                ? dp[i-1][j-1]
                : 1 + min({dp[i-1][j], dp[i][j-1], dp[i-1][j-1]});
    return dp[m][n];
}</code></pre>

<h2>3. Knapsack Patterns</h2>
<pre><code>// 0/1 Knapsack — O(nW) time
int knapsack01(vector&lt;int&gt;&amp; w, vector&lt;int&gt;&amp; v, int W) {
    int n = w.size();
    vector&lt;vector&lt;int&gt;&gt; dp(n + 1, vector&lt;int&gt;(W + 1, 0));
    for (int i = 1; i &lt;= n; i++)
        for (int j = 0; j &lt;= W; j++) {
            dp[i][j] = dp[i-1][j];
            if (w[i-1] &lt;= j)
                dp[i][j] = max(dp[i][j], dp[i-1][j - w[i-1]] + v[i-1]);
        }
    return dp[n][W];
}

// Unbounded Knapsack (Coin Change) — O(n*amount)
int coinChange(vector&lt;int&gt;&amp; coins, int amount) {
    vector&lt;int&gt; dp(amount + 1, INT_MAX);
    dp[0] = 0;
    for (int i = 1; i &lt;= amount; i++)
        for (int c : coins)
            if (c &lt;= i &amp;&amp; dp[i - c] != INT_MAX)
                dp[i] = min(dp[i], dp[i - c] + 1);
    return dp[amount] == INT_MAX ? -1 : dp[amount];
}

// Subset Sum — O(n*target)
bool subsetSum(vector&lt;int&gt;&amp; nums, int target) {
    vector&lt;bool&gt; dp(target + 1, false);
    dp[0] = true;
    for (int num : nums)
        for (int j = target; j &gt;= num; j--) // reverse for 0/1
            dp[j] = dp[j] || dp[j - num];
    return dp[target];
}</code></pre>

<h2>4. State Machine DP (Stock Problems)</h2>
<pre><code>// Buy/Sell Stock with Cooldown — O(n) time, O(1) space
int maxProfit(vector&lt;int&gt;&amp; prices) {
    int held = INT_MIN, sold = 0, rest = 0;
    for (int p : prices) {
        int prevHeld = held;
        held = max(held, rest - p);     // hold or buy from rest
        rest = max(rest, sold);          // rest or was cooldown
        sold = prevHeld + p;             // sell what we held
    }
    return max(sold, rest);
}

// State machine:
//   REST --buy--> HELD --sell--> SOLD --cooldown--> REST
//   REST --rest-> REST
//   HELD --hold-> HELD</code></pre>

<h2>DP Pattern Reference</h2>
<table>
<tr><th>Pattern</th><th>Examples</th><th>States</th><th>Complexity</th></tr>
<tr><td>Linear (1D)</td><td>Climb stairs, house robber, decode ways</td><td>dp[i]</td><td>O(n)</td></tr>
<tr><td>Two-string (2D)</td><td>LCS, edit distance, regex match</td><td>dp[i][j]</td><td>O(mn)</td></tr>
<tr><td>0/1 Knapsack</td><td>Subset sum, partition equal, target sum</td><td>dp[i][w]</td><td>O(nW)</td></tr>
<tr><td>Unbounded Knapsack</td><td>Coin change, rod cutting</td><td>dp[w]</td><td>O(nW)</td></tr>
<tr><td>Grid DP</td><td>Unique paths, min path sum</td><td>dp[r][c]</td><td>O(mn)</td></tr>
<tr><td>State Machine</td><td>Stock buy/sell, paint house</td><td>dp[i][state]</td><td>O(n*states)</td></tr>
<tr><td>Interval DP</td><td>Matrix chain, burst balloons</td><td>dp[i][j]</td><td>O(n&sup3;)</td></tr>
</table>

<div class="qa-block">
<div class="qa-q">Q: Explain the difference between top-down and bottom-up DP.</div>
<div class="qa-a"><strong>Top-down (memoization)</strong>: start from the original problem, recurse into subproblems, cache results. Natural when the recursion tree is obvious but risks stack overflow for deep recursion. <strong>Bottom-up (tabulation)</strong>: solve smaller subproblems first, build up to the answer iteratively. Better cache performance, enables space optimization (rolling array), and no recursion overhead. Both have the same time complexity.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: Solve coin change with minimum coins.</div>
<div class="qa-a">State: dp[amount] = minimum coins to make that amount. Transition: dp[i] = min(dp[i], dp[i - coin] + 1) for each coin. Base: dp[0] = 0. Order: amounts from 1 to target. This is unbounded knapsack since each coin can be used unlimited times. Time: O(n * amount), Space: O(amount).</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: How do you identify that a problem needs DP?</div>
<div class="qa-a">Two properties: (1) <strong>Overlapping subproblems</strong> — same subproblems solved repeatedly (unlike divide and conquer). (2) <strong>Optimal substructure</strong> — optimal solution built from optimal solutions to subproblems. Common signals: "minimum/maximum", "count ways", "is it possible", "longest/shortest subsequence".</div>
</div>
`
  },

  {
    id: 'dsa-greedy',
    title: 'Greedy Algorithms',
    category: 'DP & Greedy',
    starterCode: `// Greedy Algorithms — JavaScript Implementations
// ===============================================

// 1. Activity Selection (Interval Scheduling Maximization)
function activitySelection(activities) {
  // Sort by end time
  activities.sort((a, b) => a[1] - b[1]);
  const selected = [activities[0]];
  let lastEnd = activities[0][1];
  for (let i = 1; i < activities.length; i++) {
    if (activities[i][0] >= lastEnd) {
      selected.push(activities[i]);
      lastEnd = activities[i][1];
    }
  }
  return selected;
}

console.log('=== Activity Selection ===');
const acts = [[1,4],[3,5],[0,6],[5,7],[3,9],[5,9],[6,10],[8,11],[8,12],[2,14],[12,16]];
const selected = activitySelection(acts);
console.log('Selected:', selected.length, 'activities');
selected.forEach(a => console.log('  [' + a[0] + ', ' + a[1] + ')'));

// 2. Jump Game
function canJump(nums) {
  let maxReach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > maxReach) return false;
    maxReach = Math.max(maxReach, i + nums[i]);
  }
  return true;
}

console.log('\\n=== Jump Game ===');
console.log('[2,3,1,1,4] can jump:', canJump([2,3,1,1,4]));
console.log('[3,2,1,0,4] can jump:', canJump([3,2,1,0,4]));

// 3. Jump Game II (Min jumps)
function minJumps(nums) {
  let jumps = 0, farthest = 0, currentEnd = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    farthest = Math.max(farthest, i + nums[i]);
    if (i === currentEnd) {
      jumps++;
      currentEnd = farthest;
    }
  }
  return jumps;
}

console.log('Min jumps [2,3,1,1,4]:', minJumps([2,3,1,1,4]));

// 4. Meeting Rooms II (Min rooms needed)
function minMeetingRooms(intervals) {
  const starts = intervals.map(i => i[0]).sort((a,b) => a-b);
  const ends = intervals.map(i => i[1]).sort((a,b) => a-b);
  let rooms = 0, maxRooms = 0, e = 0;
  for (let s = 0; s < starts.length; s++) {
    if (starts[s] < ends[e]) {
      rooms++;
    } else {
      e++;
    }
    maxRooms = Math.max(maxRooms, rooms);
  }
  return maxRooms;
}

console.log('\\n=== Meeting Rooms ===');
console.log('[[0,30],[5,10],[15,20]] needs', minMeetingRooms([[0,30],[5,10],[15,20]]), 'rooms');

// 5. Fractional Knapsack
function fractionalKnapsack(items, capacity) {
  // items: [{weight, value}]
  items.sort((a, b) => b.value/b.weight - a.value/a.weight);
  let totalValue = 0;
  for (const item of items) {
    if (capacity >= item.weight) {
      totalValue += item.value;
      capacity -= item.weight;
    } else {
      totalValue += (capacity / item.weight) * item.value;
      break;
    }
  }
  return totalValue;
}

console.log('\\n=== Fractional Knapsack (cap=50) ===');
const items = [{weight:10,value:60},{weight:20,value:100},{weight:30,value:120}];
console.log('Max value:', fractionalKnapsack(items, 50));

// 6. Task Scheduler
function leastInterval(tasks, n) {
  const freq = new Array(26).fill(0);
  for (const t of tasks) freq[t.charCodeAt(0) - 65]++;
  freq.sort((a,b) => b - a);
  const maxFreq = freq[0];
  let idleSlots = (maxFreq - 1) * n;
  for (let i = 1; i < 26 && freq[i] > 0; i++) {
    idleSlots -= Math.min(freq[i], maxFreq - 1);
  }
  return tasks.length + Math.max(0, idleSlots);
}

console.log('\\n=== Task Scheduler ===');
console.log('Tasks: AAABBB, cooldown=2');
console.log('Min intervals:', leastInterval(['A','A','A','B','B','B'], 2));
`,
    content: `
<h1>Greedy Algorithms</h1>
<p>Greedy algorithms make <strong>locally optimal choices</strong> at each step, hoping to find a global optimum. The key challenge is <strong>proving correctness</strong> — not all problems admit greedy solutions.</p>

<h2>When Does Greedy Work?</h2>
<ul>
<li><strong>Greedy Choice Property</strong>: A locally optimal choice leads to a globally optimal solution</li>
<li><strong>Optimal Substructure</strong>: Optimal solution contains optimal solutions to subproblems</li>
</ul>

<div class="warning-note">If you can construct a counterexample where the greedy choice fails, you need DP instead. Always verify greedy correctness by exchange argument or induction.</div>

<h2>1. Activity Selection / Interval Scheduling</h2>
<pre><code>// C++ — O(n log n)
int maxActivities(vector&lt;pair&lt;int,int&gt;&gt;&amp; intervals) {
    sort(intervals.begin(), intervals.end(),
         [](auto&amp; a, auto&amp; b) { return a.second &lt; b.second; });
    int count = 1, lastEnd = intervals[0].second;
    for (int i = 1; i &lt; (int)intervals.size(); i++) {
        if (intervals[i].first &gt;= lastEnd) {
            count++;
            lastEnd = intervals[i].second;
        }
    }
    return count;
}
// Greedy: always pick the activity that ends earliest
// Proof: by exchange argument — swapping any chosen activity
//        for an earlier-ending one never reduces the count</code></pre>

<h2>2. Meeting Rooms II</h2>
<pre><code>// C++ — O(n log n) using sort + two pointers
int minMeetingRooms(vector&lt;vector&lt;int&gt;&gt;&amp; intervals) {
    vector&lt;int&gt; starts, ends;
    for (auto&amp; i : intervals) {
        starts.push_back(i[0]);
        ends.push_back(i[1]);
    }
    sort(starts.begin(), starts.end());
    sort(ends.begin(), ends.end());
    int rooms = 0, maxRooms = 0, e = 0;
    for (int s = 0; s &lt; (int)starts.size(); s++) {
        if (starts[s] &lt; ends[e]) rooms++;
        else e++;
        maxRooms = max(maxRooms, rooms);
    }
    return maxRooms;
}

// Alternative: priority_queue approach
int minRoomsPQ(vector&lt;vector&lt;int&gt;&gt;&amp; intervals) {
    sort(intervals.begin(), intervals.end());
    priority_queue&lt;int, vector&lt;int&gt;, greater&lt;int&gt;&gt; pq; // min-heap of end times
    for (auto&amp; i : intervals) {
        if (!pq.empty() &amp;&amp; pq.top() &lt;= i[0]) pq.pop();
        pq.push(i[1]);
    }
    return pq.size();
}</code></pre>

<h2>3. Jump Game</h2>
<pre><code>// Can reach end? — O(n) greedy
bool canJump(vector&lt;int&gt;&amp; nums) {
    int maxReach = 0;
    for (int i = 0; i &lt; (int)nums.size(); i++) {
        if (i &gt; maxReach) return false;
        maxReach = max(maxReach, i + nums[i]);
    }
    return true;
}

// Minimum jumps — O(n) greedy (BFS-like)
int minJumps(vector&lt;int&gt;&amp; nums) {
    int jumps = 0, farthest = 0, currentEnd = 0;
    for (int i = 0; i &lt; (int)nums.size() - 1; i++) {
        farthest = max(farthest, i + nums[i]);
        if (i == currentEnd) {
            jumps++;
            currentEnd = farthest;
        }
    }
    return jumps;
}</code></pre>

<h2>4. Fractional Knapsack</h2>
<pre><code>// C++ — O(n log n)
double fractionalKnapsack(vector&lt;pair&lt;int,int&gt;&gt;&amp; items, int W) {
    // items: {weight, value}
    sort(items.begin(), items.end(), [](auto&amp; a, auto&amp; b) {
        return (double)a.second / a.first &gt; (double)b.second / b.first;
    });
    double totalValue = 0;
    for (auto [w, v] : items) {
        if (W &gt;= w) {
            totalValue += v;
            W -= w;
        } else {
            totalValue += (double)W / w * v;
            break;
        }
    }
    return totalValue;
}
// Greedy: pick items with highest value/weight ratio first
// Works for fractional but NOT for 0/1 knapsack (need DP)</code></pre>

<h2>5. Task Scheduler</h2>
<pre><code>// C++ — O(n) (n = number of tasks)
int leastInterval(vector&lt;char&gt;&amp; tasks, int n) {
    int freq[26] = {};
    for (char t : tasks) freq[t - 'A']++;
    int maxFreq = *max_element(freq, freq + 26);
    int maxCount = count(freq, freq + 26, maxFreq);
    // Minimum slots = (maxFreq-1) * (n+1) + maxCount
    // But at least tasks.size() (no idle needed)
    return max((int)tasks.size(), (maxFreq - 1) * (n + 1) + maxCount);
}</code></pre>

<h2>Greedy vs DP Decision</h2>
<table>
<tr><th>Property</th><th>Greedy</th><th>DP</th></tr>
<tr><td>Approach</td><td>Local optimal choice</td><td>Explore all subproblems</td></tr>
<tr><td>Correctness</td><td>Needs proof (exchange argument)</td><td>Always correct if states defined properly</td></tr>
<tr><td>Efficiency</td><td>Usually O(n log n)</td><td>Often O(n&sup2;) or O(nW)</td></tr>
<tr><td>Fractional knapsack</td><td>Greedy works</td><td>Not needed</td></tr>
<tr><td>0/1 knapsack</td><td>Greedy FAILS</td><td>DP required</td></tr>
<tr><td>Activity selection</td><td>Greedy works</td><td>DP overkill</td></tr>
<tr><td>Coin change (arbitrary)</td><td>Greedy FAILS</td><td>DP required</td></tr>
</table>

<div class="qa-block">
<div class="qa-q">Q: When is greedy correct vs when do you need DP?</div>
<div class="qa-a">Greedy works when <strong>making the locally best choice never closes off a globally optimal solution</strong>. Test with counterexamples. Classic failures: 0/1 knapsack (greedy picks high ratio but misses combinations), coin change with non-standard denominations (e.g., coins [1,3,4] amount 6: greedy gives 4+1+1=3 coins, DP gives 3+3=2 coins). If no counterexample found, prove via exchange argument.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: How does the task scheduler formula work?</div>
<div class="qa-a">The most frequent task creates (maxFreq-1) "frames" of size (n+1) between executions. Fill these frames with other tasks. The answer is max(total_tasks, (maxFreq-1)*(n+1)+maxCount) where maxCount = number of tasks with maximum frequency. The first term handles the case where tasks fill all idle slots.</div>
</div>
`
  },

  // ============================================================
  // CORE DS
  // ============================================================
  {
    id: 'dsa-stacks-queues',
    title: 'Stacks, Queues & Monotonic Patterns',
    category: 'Core DS',
    starterCode: `// Stacks, Queues & Monotonic Patterns — JavaScript
// ==================================================

// 1. Next Greater Element (Monotonic Stack)
function nextGreater(arr) {
  const n = arr.length;
  const result = new Array(n).fill(-1);
  const stack = []; // indices
  for (let i = 0; i < n; i++) {
    while (stack.length && arr[stack[stack.length - 1]] < arr[i]) {
      result[stack.pop()] = arr[i];
    }
    stack.push(i);
  }
  return result;
}

console.log('=== Next Greater Element ===');
console.log('Array: [4, 5, 2, 10, 8]');
console.log('Result:', nextGreater([4, 5, 2, 10, 8]));

// 2. Largest Rectangle in Histogram
function largestRectangle(heights) {
  const stack = []; // indices
  let maxArea = 0;
  const n = heights.length;
  for (let i = 0; i <= n; i++) {
    const h = i === n ? 0 : heights[i];
    while (stack.length && heights[stack[stack.length - 1]] > h) {
      const height = heights[stack.pop()];
      const width = stack.length ? i - stack[stack.length - 1] - 1 : i;
      maxArea = Math.max(maxArea, height * width);
    }
    stack.push(i);
  }
  return maxArea;
}

console.log('\\n=== Largest Rectangle in Histogram ===');
console.log('Heights: [2, 1, 5, 6, 2, 3]');
console.log('Max area:', largestRectangle([2, 1, 5, 6, 2, 3]));

// 3. Sliding Window Maximum (Monotonic Deque)
function maxSlidingWindow(nums, k) {
  const deque = []; // indices, front = max
  const result = [];
  for (let i = 0; i < nums.length; i++) {
    while (deque.length && deque[0] <= i - k) deque.shift();
    while (deque.length && nums[deque[deque.length - 1]] < nums[i]) deque.pop();
    deque.push(i);
    if (i >= k - 1) result.push(nums[deque[0]]);
  }
  return result;
}

console.log('\\n=== Sliding Window Maximum (k=3) ===');
console.log('Array: [1, 3, -1, -3, 5, 3, 6, 7]');
console.log('Result:', maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3));

// 4. Queue using Two Stacks
class MyQueue {
  constructor() { this.inStack = []; this.outStack = []; }
  push(x) { this.inStack.push(x); }
  pop() {
    if (!this.outStack.length)
      while (this.inStack.length) this.outStack.push(this.inStack.pop());
    return this.outStack.pop();
  }
  peek() {
    if (!this.outStack.length)
      while (this.inStack.length) this.outStack.push(this.inStack.pop());
    return this.outStack[this.outStack.length - 1];
  }
  empty() { return !this.inStack.length && !this.outStack.length; }
}

console.log('\\n=== Queue using Two Stacks ===');
const q = new MyQueue();
q.push(1); q.push(2); q.push(3);
console.log('pop:', q.pop(), 'peek:', q.peek(), 'pop:', q.pop());

// 5. Min Stack
class MinStack {
  constructor() { this.stack = []; this.minStack = []; }
  push(x) {
    this.stack.push(x);
    this.minStack.push(
      this.minStack.length ? Math.min(x, this.minStack[this.minStack.length - 1]) : x
    );
  }
  pop() { this.stack.pop(); this.minStack.pop(); }
  top() { return this.stack[this.stack.length - 1]; }
  getMin() { return this.minStack[this.minStack.length - 1]; }
}

console.log('\\n=== Min Stack ===');
const ms = new MinStack();
ms.push(5); ms.push(2); ms.push(7); ms.push(1);
console.log('min:', ms.getMin()); // 1
ms.pop();
console.log('after pop, min:', ms.getMin()); // 2
`,
    content: `
<h1>Stacks, Queues &amp; Monotonic Patterns</h1>
<p>Stacks and queues are deceptively simple data structures that power some of the most elegant interview solutions. <strong>Monotonic stack/deque</strong> patterns are especially high-value for SDE-2+ rounds.</p>

<h2>Stack &amp; Queue Basics</h2>
<pre><code>// C++ STL
#include &lt;stack&gt;
#include &lt;queue&gt;
#include &lt;deque&gt;

stack&lt;int&gt; stk;      // LIFO: push, pop, top, empty, size
queue&lt;int&gt; q;        // FIFO: push, pop, front, back, empty
deque&lt;int&gt; dq;       // Both ends: push_front/back, pop_front/back
priority_queue&lt;int&gt; pq;  // Max-heap by default</code></pre>

<h2>1. Monotonic Stack: Next Greater Element</h2>
<pre><code>// C++ — O(n) time, O(n) space
// Maintains a decreasing stack
vector&lt;int&gt; nextGreater(vector&lt;int&gt;&amp; arr) {
    int n = arr.size();
    vector&lt;int&gt; result(n, -1);
    stack&lt;int&gt; stk; // indices
    for (int i = 0; i &lt; n; i++) {
        while (!stk.empty() &amp;&amp; arr[stk.top()] &lt; arr[i]) {
            result[stk.top()] = arr[i];
            stk.pop();
        }
        stk.push(i);
    }
    return result;
}

// Visual:
// arr = [4, 5, 2, 10, 8]
// i=0: stack=[4]
// i=1: 5&gt;4, pop 4 -&gt; result[0]=5, stack=[5]
// i=2: stack=[5, 2]
// i=3: 10&gt;2, pop 2 -&gt; result[2]=10
//      10&gt;5, pop 5 -&gt; result[1]=10, stack=[10]
// i=4: stack=[10, 8]
// Result: [5, 10, 10, -1, -1]</code></pre>

<h2>2. Largest Rectangle in Histogram</h2>
<pre><code>// C++ — O(n) time, O(n) space
// Stack maintains increasing heights
int largestRectangleArea(vector&lt;int&gt;&amp; heights) {
    stack&lt;int&gt; stk;
    int maxArea = 0, n = heights.size();
    for (int i = 0; i &lt;= n; i++) {
        int h = (i == n) ? 0 : heights[i];
        while (!stk.empty() &amp;&amp; heights[stk.top()] &gt; h) {
            int height = heights[stk.top()]; stk.pop();
            int width = stk.empty() ? i : i - stk.top() - 1;
            maxArea = max(maxArea, height * width);
        }
        stk.push(i);
    }
    return maxArea;
}

// heights = [2, 1, 5, 6, 2, 3]
//                   [---]
//               [-------]
//           [---]   |   [---]
// [---] [-----------+-------]
//   2    1    5   6   2   3
// Largest rectangle = 5*2 = 10 (heights 5,6 width 2)</code></pre>

<h2>3. Sliding Window Maximum (Monotonic Deque)</h2>
<pre><code>// C++ — O(n) time, O(k) space
vector&lt;int&gt; maxSlidingWindow(vector&lt;int&gt;&amp; nums, int k) {
    deque&lt;int&gt; dq; // stores indices, front = max in window
    vector&lt;int&gt; result;
    for (int i = 0; i &lt; (int)nums.size(); i++) {
        // Remove indices outside window
        while (!dq.empty() &amp;&amp; dq.front() &lt;= i - k) dq.pop_front();
        // Remove smaller elements from back
        while (!dq.empty() &amp;&amp; nums[dq.back()] &lt; nums[i]) dq.pop_back();
        dq.push_back(i);
        if (i &gt;= k - 1) result.push_back(nums[dq.front()]);
    }
    return result;
}</code></pre>

<h2>4. Queue Using Two Stacks</h2>
<pre><code>// C++ — Amortized O(1) per operation
class MyQueue {
    stack&lt;int&gt; inStack, outStack;
    void transfer() {
        while (!inStack.empty()) {
            outStack.push(inStack.top());
            inStack.pop();
        }
    }
public:
    void push(int x) { inStack.push(x); }
    int pop() {
        if (outStack.empty()) transfer();
        int val = outStack.top(); outStack.pop();
        return val;
    }
    int peek() {
        if (outStack.empty()) transfer();
        return outStack.top();
    }
    bool empty() { return inStack.empty() &amp;&amp; outStack.empty(); }
};
// Each element is pushed/popped from each stack at most once
// -&gt; amortized O(1) per operation</code></pre>

<h2>5. Min Stack</h2>
<pre><code>// C++ — O(1) for all operations including getMin
class MinStack {
    stack&lt;int&gt; stk, minStk;
public:
    void push(int val) {
        stk.push(val);
        minStk.push(minStk.empty() ? val : min(val, minStk.top()));
    }
    void pop() { stk.pop(); minStk.pop(); }
    int top() { return stk.top(); }
    int getMin() { return minStk.top(); }
};</code></pre>

<h2>Complexity Reference</h2>
<table>
<tr><th>Data Structure</th><th>Push</th><th>Pop</th><th>Peek/Front</th><th>Search</th></tr>
<tr><td>Stack</td><td>O(1)</td><td>O(1)</td><td>O(1)</td><td>O(n)</td></tr>
<tr><td>Queue</td><td>O(1)</td><td>O(1)</td><td>O(1)</td><td>O(n)</td></tr>
<tr><td>Deque</td><td>O(1)</td><td>O(1)</td><td>O(1)</td><td>O(n)</td></tr>
<tr><td>Queue (2 Stacks)</td><td>O(1)</td><td>O(1) amort.</td><td>O(1) amort.</td><td>O(n)</td></tr>
<tr><td>Min Stack</td><td>O(1)</td><td>O(1)</td><td>O(1) min</td><td>O(n)</td></tr>
</table>

<div class="qa-block">
<div class="qa-q">Q: Implement a queue using two stacks.</div>
<div class="qa-a">Use an <code>inStack</code> for pushes and an <code>outStack</code> for pops. On pop/peek, if outStack is empty, transfer all elements from inStack to outStack (reversing order). Each element is transferred at most once, so all operations are <strong>amortized O(1)</strong>. Push is always O(1). This is a classic interview question testing understanding of amortized analysis.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: When do you use a monotonic stack vs a monotonic deque?</div>
<div class="qa-a"><strong>Monotonic stack</strong>: when you need to find next/previous greater/smaller elements. The stack processes elements in one direction. <strong>Monotonic deque</strong>: when you need the max/min in a sliding window — you need to remove from both ends (expired elements from front, smaller elements from back).</div>
</div>

<div class="warning-note">The <strong>largest rectangle in histogram</strong> pattern extends to <strong>maximal rectangle in a binary matrix</strong> — treat each row as a histogram and apply the stack algorithm row by row.</div>
`
  },

  {
    id: 'dsa-heaps-maps',
    title: 'Heaps, Hash Maps & Sets',
    category: 'Core DS',
    starterCode: `// Heaps, Hash Maps & Sets — JavaScript Implementations
// ====================================================

// 1. Min-Heap Implementation
class MinHeap {
  constructor() { this.data = []; }
  size() { return this.data.length; }
  parent(i) { return (i - 1) >> 1; }
  left(i) { return 2 * i + 1; }
  right(i) { return 2 * i + 2; }

  push(val) {
    this.data.push(val);
    this._bubbleUp(this.data.length - 1);
  }
  pop() {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length) { this.data[0] = last; this._sinkDown(0); }
    return top;
  }
  peek() { return this.data[0]; }

  _bubbleUp(i) {
    while (i > 0 && this.data[i] < this.data[this.parent(i)]) {
      [this.data[i], this.data[this.parent(i)]] = [this.data[this.parent(i)], this.data[i]];
      i = this.parent(i);
    }
  }
  _sinkDown(i) {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const l = this.left(i), r = this.right(i);
      if (l < n && this.data[l] < this.data[smallest]) smallest = l;
      if (r < n && this.data[r] < this.data[smallest]) smallest = r;
      if (smallest === i) break;
      [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
      i = smallest;
    }
  }
}

console.log('=== Min Heap ===');
const heap = new MinHeap();
[5, 3, 8, 1, 2, 7].forEach(x => heap.push(x));
const sorted = [];
while (heap.size()) sorted.push(heap.pop());
console.log('Heap sort:', sorted);

// 2. K-th Largest Element (Quick Select)
function kthLargest(nums, k) {
  k = nums.length - k; // convert to k-th smallest
  function quickSelect(lo, hi) {
    const pivot = nums[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
      if (nums[j] <= pivot) {
        [nums[i], nums[j]] = [nums[j], nums[i]];
        i++;
      }
    }
    [nums[i], nums[hi]] = [nums[hi], nums[i]];
    if (i === k) return nums[i];
    return i < k ? quickSelect(i + 1, hi) : quickSelect(lo, i - 1);
  }
  return quickSelect(0, nums.length - 1);
}

console.log('\\n=== K-th Largest ===');
console.log('Array: [3,2,1,5,6,4], k=2');
console.log('Result:', kthLargest([3,2,1,5,6,4], 2));

// 3. Top K Frequent Elements
function topKFrequent(nums, k) {
  const freq = new Map();
  for (const n of nums) freq.set(n, (freq.get(n) || 0) + 1);
  // Bucket sort by frequency
  const buckets = Array.from({length: nums.length + 1}, () => []);
  for (const [num, count] of freq) buckets[count].push(num);
  const result = [];
  for (let i = buckets.length - 1; i >= 0 && result.length < k; i--) {
    result.push(...buckets[i]);
  }
  return result.slice(0, k);
}

console.log('\\n=== Top K Frequent ===');
console.log('[1,1,1,2,2,3], k=2:', topKFrequent([1,1,1,2,2,3], 2));

// 4. Merge K Sorted Lists (simulated)
function mergeKSorted(lists) {
  const heap = new MinHeap();
  // Push first element of each list with list index and position
  const result = [];
  const pointers = new Array(lists.length).fill(0);

  // Simplified: merge all into one sorted array
  const all = [];
  for (const list of lists) all.push(...list);
  all.sort((a, b) => a - b);
  return all;
}

console.log('\\n=== Merge K Sorted ===');
console.log(mergeKSorted([[1,4,5],[1,3,4],[2,6]]));

// 5. LRU Cache using Map (maintains insertion order)
class LRUCache {
  constructor(capacity) { this.cap = capacity; this.cache = new Map(); }
  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }
  put(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);
    this.cache.set(key, value);
    if (this.cache.size > this.cap)
      this.cache.delete(this.cache.keys().next().value);
  }
}

console.log('\\n=== LRU Cache (cap=2) ===');
const lru = new LRUCache(2);
lru.put(1, 1); lru.put(2, 2);
console.log('get(1):', lru.get(1)); // 1
lru.put(3, 3); // evicts key 2
console.log('get(2):', lru.get(2)); // -1
`,
    content: `
<h1>Heaps, Hash Maps &amp; Sets</h1>
<p>These fundamental data structures underpin countless interview problems. Understanding their <strong>internals and trade-offs</strong> is essential for SDE-2+ candidates.</p>

<h2>Heap Operations</h2>
<pre><code>// C++ priority_queue (max-heap by default)
priority_queue&lt;int&gt; maxPQ;                        // max-heap
priority_queue&lt;int, vector&lt;int&gt;, greater&lt;int&gt;&gt; minPQ; // min-heap

// Custom comparator
auto cmp = [](pair&lt;int,int&gt;&amp; a, pair&lt;int,int&gt;&amp; b) {
    return a.second &gt; b.second; // min-heap by second
};
priority_queue&lt;pair&lt;int,int&gt;, vector&lt;pair&lt;int,int&gt;&gt;, decltype(cmp)&gt; pq(cmp);

// Heap implementation internals:
//        1          Index: parent = (i-1)/2
//       / \\                left  = 2*i + 1
//      3   5               right = 2*i + 2
//     / \\
//    7   9
// Array: [1, 3, 5, 7, 9]</code></pre>

<h2>Build Heap — O(n) Not O(n log n)</h2>
<pre><code>// Heapify: build heap from array in O(n)
void heapify(vector&lt;int&gt;&amp; arr, int n, int i) {
    int smallest = i, l = 2*i+1, r = 2*i+2;
    if (l &lt; n &amp;&amp; arr[l] &lt; arr[smallest]) smallest = l;
    if (r &lt; n &amp;&amp; arr[r] &lt; arr[smallest]) smallest = r;
    if (smallest != i) {
        swap(arr[i], arr[smallest]);
        heapify(arr, n, smallest);
    }
}
// Build heap: start from last non-leaf, go up
void buildHeap(vector&lt;int&gt;&amp; arr) {
    for (int i = arr.size()/2 - 1; i &gt;= 0; i--)
        heapify(arr, arr.size(), i);
}
// Why O(n)? Most nodes are near bottom (height 0-1),
// few nodes are near top (height log n).</code></pre>

<h2>K-th Largest Element</h2>
<pre><code>// QuickSelect — O(n) average, O(n^2) worst
int quickSelect(vector&lt;int&gt;&amp; nums, int lo, int hi, int k) {
    int pivot = nums[hi], i = lo;
    for (int j = lo; j &lt; hi; j++)
        if (nums[j] &lt;= pivot) swap(nums[i++], nums[j]);
    swap(nums[i], nums[hi]);
    if (i == k) return nums[i];
    return i &lt; k ? quickSelect(nums, i+1, hi, k)
                  : quickSelect(nums, lo, i-1, k);
}

int findKthLargest(vector&lt;int&gt;&amp; nums, int k) {
    return quickSelect(nums, 0, nums.size()-1, nums.size()-k);
}

// Heap approach — O(n log k) time, O(k) space
int findKthLargestHeap(vector&lt;int&gt;&amp; nums, int k) {
    priority_queue&lt;int, vector&lt;int&gt;, greater&lt;int&gt;&gt; minPQ; // size k
    for (int num : nums) {
        minPQ.push(num);
        if ((int)minPQ.size() &gt; k) minPQ.pop();
    }
    return minPQ.top();
}</code></pre>

<h2>Merge K Sorted Lists</h2>
<pre><code>// C++ — O(N log k) where N=total elements, k=number of lists
ListNode* mergeKLists(vector&lt;ListNode*&gt;&amp; lists) {
    auto cmp = [](ListNode* a, ListNode* b) {
        return a-&gt;val &gt; b-&gt;val;
    };
    priority_queue&lt;ListNode*, vector&lt;ListNode*&gt;, decltype(cmp)&gt; pq(cmp);

    for (auto list : lists)
        if (list) pq.push(list);

    ListNode dummy(0);
    ListNode* tail = &amp;dummy;
    while (!pq.empty()) {
        auto node = pq.top(); pq.pop();
        tail-&gt;next = node;
        tail = tail-&gt;next;
        if (node-&gt;next) pq.push(node-&gt;next);
    }
    return dummy.next;
}</code></pre>

<h2>Hash Map: Design from Scratch</h2>
<pre><code>// C++ — Simplified hash map with chaining
class MyHashMap {
    static const int SIZE = 10007; // prime
    vector&lt;list&lt;pair&lt;int,int&gt;&gt;&gt; buckets;
public:
    MyHashMap() : buckets(SIZE) {}

    void put(int key, int value) {
        auto&amp; chain = buckets[key % SIZE];
        for (auto&amp; [k, v] : chain) {
            if (k == key) { v = value; return; }
        }
        chain.push_back({key, value});
    }

    int get(int key) {
        auto&amp; chain = buckets[key % SIZE];
        for (auto&amp; [k, v] : chain)
            if (k == key) return v;
        return -1;
    }

    void remove(int key) {
        auto&amp; chain = buckets[key % SIZE];
        chain.remove_if([key](auto&amp; p) { return p.first == key; });
    }
};</code></pre>

<h2>C++ Container Comparison</h2>
<table>
<tr><th>Container</th><th>Underlying</th><th>Insert</th><th>Lookup</th><th>Ordered</th></tr>
<tr><td>unordered_map</td><td>Hash table</td><td>O(1) avg</td><td>O(1) avg</td><td>No</td></tr>
<tr><td>map</td><td>Red-black tree</td><td>O(log n)</td><td>O(log n)</td><td>Yes</td></tr>
<tr><td>unordered_set</td><td>Hash table</td><td>O(1) avg</td><td>O(1) avg</td><td>No</td></tr>
<tr><td>set</td><td>Red-black tree</td><td>O(log n)</td><td>O(log n)</td><td>Yes</td></tr>
<tr><td>priority_queue</td><td>Binary heap</td><td>O(log n)</td><td>O(1) top</td><td>Partial</td></tr>
</table>

<div class="qa-block">
<div class="qa-q">Q: Find the K-th largest element in O(n) average time.</div>
<div class="qa-a">Use <strong>QuickSelect</strong> (partition-based selection). Pick a pivot, partition array. If pivot position equals target index, return it. Otherwise recurse on the correct half. Average O(n) because each recursive call halves the input. Randomize pivot to avoid worst-case O(n&sup2;). Alternatively, use a min-heap of size k for O(n log k).</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: When would you use map vs unordered_map in C++?</div>
<div class="qa-a"><strong>unordered_map</strong>: O(1) average operations, use when you only need key-value lookup and don't need ordering. <strong>map</strong>: O(log n) operations but keeps keys sorted — use when you need ordered iteration, lower_bound/upper_bound queries, or when hash collisions are a concern (worst case O(n) for unordered_map).</div>
</div>

<div class="warning-note">Build heap is O(n), NOT O(n log n). This is a common interview gotcha. The math: sum of heights is O(n) since most nodes are near the leaves and have small height.</div>
`
  },

  {
    id: 'dsa-linked-lists',
    title: 'Linked Lists',
    category: 'Core DS',
    starterCode: `// Linked Lists — JavaScript Implementations
// ==========================================

class ListNode {
  constructor(val, next = null) { this.val = val; this.next = next; }
}

function fromArray(arr) {
  const dummy = new ListNode(0);
  let curr = dummy;
  for (const v of arr) { curr.next = new ListNode(v); curr = curr.next; }
  return dummy.next;
}

function toArray(head) {
  const result = [];
  while (head) { result.push(head.val); head = head.next; }
  return result;
}

// 1. Reverse Linked List (Iterative)
function reverseList(head) {
  let prev = null, curr = head;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}

console.log('=== Reverse List ===');
console.log('Original: [1,2,3,4,5]');
console.log('Reversed:', toArray(reverseList(fromArray([1,2,3,4,5]))));

// 2. Reverse Linked List (Recursive)
function reverseListRecursive(head) {
  if (!head || !head.next) return head;
  const newHead = reverseListRecursive(head.next);
  head.next.next = head;
  head.next = null;
  return newHead;
}
console.log('Reversed (recursive):', toArray(reverseListRecursive(fromArray([1,2,3,4,5]))));

// 3. Detect Cycle (Floyd's)
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}

const cycleList = fromArray([1,2,3,4]);
cycleList.next.next.next.next = cycleList.next; // 4 -> 2
console.log('\\nHas cycle:', hasCycle(cycleList));
console.log('No cycle:', hasCycle(fromArray([1,2,3])));

// 4. Merge Two Sorted Lists
function mergeTwoLists(l1, l2) {
  const dummy = new ListNode(0);
  let curr = dummy;
  while (l1 && l2) {
    if (l1.val <= l2.val) { curr.next = l1; l1 = l1.next; }
    else { curr.next = l2; l2 = l2.next; }
    curr = curr.next;
  }
  curr.next = l1 || l2;
  return dummy.next;
}

console.log('\\n=== Merge Sorted Lists ===');
console.log(toArray(mergeTwoLists(fromArray([1,3,5]), fromArray([2,4,6]))));

// 5. Find Middle
function findMiddle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow.val;
}
console.log('\\nMiddle of [1,2,3,4,5]:', findMiddle(fromArray([1,2,3,4,5])));

// 6. Reverse in Groups of K
function reverseKGroup(head, k) {
  let count = 0, curr = head;
  while (curr && count < k) { curr = curr.next; count++; }
  if (count < k) return head;

  let prev = null;
  curr = head;
  for (let i = 0; i < k; i++) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  head.next = reverseKGroup(curr, k);
  return prev;
}

console.log('\\n=== Reverse in groups of 3 ===');
console.log('[1,2,3,4,5,6,7] ->', toArray(reverseKGroup(fromArray([1,2,3,4,5,6,7]), 3)));
`,
    content: `
<h1>Linked Lists</h1>
<p>Linked list problems test <strong>pointer manipulation</strong> skills. The key patterns are: <strong>reverse</strong>, <strong>fast/slow pointers</strong>, <strong>dummy node</strong>, and <strong>merge</strong>.</p>

<h2>Node Definition</h2>
<pre><code>// C++
struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(nullptr) {}
};

// 1 -&gt; 2 -&gt; 3 -&gt; 4 -&gt; nullptr</code></pre>

<h2>1. Reverse Linked List</h2>
<pre><code>// Iterative — O(n) time, O(1) space
ListNode* reverse(ListNode* head) {
    ListNode* prev = nullptr;
    ListNode* curr = head;
    while (curr) {
        ListNode* next = curr-&gt;next;
        curr-&gt;next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}

// Visual:
// prev  curr  next
// null   1 -&gt; 2 -&gt; 3
// null &lt;- 1    2 -&gt; 3
//         1 &lt;- 2    3
//         1 &lt;- 2 &lt;- 3

// Recursive — O(n) time, O(n) space (stack)
ListNode* reverseRecursive(ListNode* head) {
    if (!head || !head-&gt;next) return head;
    ListNode* newHead = reverseRecursive(head-&gt;next);
    head-&gt;next-&gt;next = head;
    head-&gt;next = nullptr;
    return newHead;
}</code></pre>

<h2>2. Floyd's Cycle Detection</h2>
<pre><code>// Detect cycle — O(n) time, O(1) space
bool hasCycle(ListNode* head) {
    ListNode* slow = head;
    ListNode* fast = head;
    while (fast &amp;&amp; fast-&gt;next) {
        slow = slow-&gt;next;
        fast = fast-&gt;next-&gt;next;
        if (slow == fast) return true;
    }
    return false;
}

// Find cycle start — O(n) time, O(1) space
ListNode* detectCycleStart(ListNode* head) {
    ListNode* slow = head;
    ListNode* fast = head;
    while (fast &amp;&amp; fast-&gt;next) {
        slow = slow-&gt;next;
        fast = fast-&gt;next-&gt;next;
        if (slow == fast) {
            slow = head;
            while (slow != fast) {
                slow = slow-&gt;next;
                fast = fast-&gt;next;
            }
            return slow; // cycle start
        }
    }
    return nullptr;
}

// Why does this work?
// When slow &amp; fast meet: slow traveled d+k, fast traveled d+k+nC
// Since fast = 2*slow: d+k+nC = 2(d+k) =&gt; d = nC - k
// So starting from head (d steps) and from meeting point (nC-k steps)
// both arrive at cycle start.</code></pre>

<h2>3. Merge Two Sorted Lists</h2>
<pre><code>// O(n+m) time, O(1) space
ListNode* mergeTwoLists(ListNode* l1, ListNode* l2) {
    ListNode dummy(0);
    ListNode* tail = &amp;dummy;
    while (l1 &amp;&amp; l2) {
        if (l1-&gt;val &lt;= l2-&gt;val) {
            tail-&gt;next = l1; l1 = l1-&gt;next;
        } else {
            tail-&gt;next = l2; l2 = l2-&gt;next;
        }
        tail = tail-&gt;next;
    }
    tail-&gt;next = l1 ? l1 : l2;
    return dummy.next;
}</code></pre>

<h2>4. Reverse Nodes in K-Group</h2>
<pre><code>// O(n) time, O(1) space (iterative approach)
ListNode* reverseKGroup(ListNode* head, int k) {
    // Check if k nodes available
    ListNode* check = head;
    for (int i = 0; i &lt; k; i++) {
        if (!check) return head;
        check = check-&gt;next;
    }
    // Reverse k nodes
    ListNode* prev = nullptr;
    ListNode* curr = head;
    for (int i = 0; i &lt; k; i++) {
        ListNode* next = curr-&gt;next;
        curr-&gt;next = prev;
        prev = curr;
        curr = next;
    }
    head-&gt;next = reverseKGroup(curr, k);
    return prev;
}

// [1,2,3,4,5,6,7], k=3
// [3,2,1, 6,5,4, 7]</code></pre>

<h2>5. LRU Cache (Doubly Linked List + Hash Map)</h2>
<pre><code>// O(1) get and put
class LRUCache {
    struct Node {
        int key, val;
        Node *prev, *next;
        Node(int k, int v) : key(k), val(v), prev(nullptr), next(nullptr) {}
    };
    int capacity;
    unordered_map&lt;int, Node*&gt; map;
    Node *head, *tail; // dummy nodes

    void remove(Node* node) {
        node-&gt;prev-&gt;next = node-&gt;next;
        node-&gt;next-&gt;prev = node-&gt;prev;
    }
    void addToFront(Node* node) {
        node-&gt;next = head-&gt;next;
        node-&gt;prev = head;
        head-&gt;next-&gt;prev = node;
        head-&gt;next = node;
    }
public:
    LRUCache(int cap) : capacity(cap) {
        head = new Node(0, 0);
        tail = new Node(0, 0);
        head-&gt;next = tail;
        tail-&gt;prev = head;
    }
    int get(int key) {
        if (!map.count(key)) return -1;
        Node* node = map[key];
        remove(node);
        addToFront(node);
        return node-&gt;val;
    }
    void put(int key, int value) {
        if (map.count(key)) {
            remove(map[key]);
            map[key]-&gt;val = value;
            addToFront(map[key]);
        } else {
            Node* node = new Node(key, value);
            map[key] = node;
            addToFront(node);
            if ((int)map.size() &gt; capacity) {
                Node* lru = tail-&gt;prev;
                remove(lru);
                map.erase(lru-&gt;key);
                delete lru;
            }
        }
    }
};</code></pre>

<h2>Key Patterns</h2>
<table>
<tr><th>Pattern</th><th>Technique</th><th>Problems</th></tr>
<tr><td>Reverse</td><td>prev/curr/next pointers</td><td>Reverse list, reverse K-group, palindrome list</td></tr>
<tr><td>Fast/Slow</td><td>Two pointers at different speeds</td><td>Cycle detection, find middle, remove N-th from end</td></tr>
<tr><td>Dummy Node</td><td>Sentinel node before head</td><td>Merge lists, insert/delete operations</td></tr>
<tr><td>Merge</td><td>Two-pointer merge</td><td>Merge sorted lists, sort list (merge sort)</td></tr>
</table>

<div class="qa-block">
<div class="qa-q">Q: Reverse a linked list iteratively and recursively.</div>
<div class="qa-a"><strong>Iterative</strong>: maintain prev, curr, next pointers. In each step: save next, point curr to prev, advance both. O(n) time, O(1) space. <strong>Recursive</strong>: recurse to end, on backtrack set head.next.next = head, head.next = null. O(n) time, O(n) stack space. Interviewers often ask for both.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: How does Floyd's algorithm find the cycle start?</div>
<div class="qa-a">When slow (speed 1) meets fast (speed 2), slow traveled d+k steps and fast traveled d+k+nC steps (C=cycle length). Since fast = 2*slow: d = nC-k. So if you reset one pointer to head and move both at speed 1, they meet at the cycle start after d steps. This is a classic mathematical proof asked in interviews.</div>
</div>
`
  },

  // ============================================================
  // SORTING & SEARCHING
  // ============================================================
  {
    id: 'dsa-sorting',
    title: 'Sorting Algorithms',
    category: 'Sorting & Searching',
    starterCode: `// Sorting Algorithms — JavaScript Implementations
// ================================================

// 1. Merge Sort
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }
  return [...result, ...left.slice(i), ...right.slice(j)];
}

console.log('=== Merge Sort ===');
console.log(mergeSort([38, 27, 43, 3, 9, 82, 10]));

// 2. Quick Sort
function quickSort(arr, lo = 0, hi = arr.length - 1) {
  if (lo >= hi) return arr;
  const pivot = arr[hi];
  let i = lo;
  for (let j = lo; j < hi; j++) {
    if (arr[j] < pivot) { [arr[i], arr[j]] = [arr[j], arr[i]]; i++; }
  }
  [arr[i], arr[hi]] = [arr[hi], arr[i]];
  quickSort(arr, lo, i - 1);
  quickSort(arr, i + 1, hi);
  return arr;
}

console.log('\\n=== Quick Sort ===');
console.log(quickSort([38, 27, 43, 3, 9, 82, 10]));

// 3. Heap Sort
function heapSort(arr) {
  const n = arr.length;
  function heapify(size, i) {
    let largest = i, l = 2*i+1, r = 2*i+2;
    if (l < size && arr[l] > arr[largest]) largest = l;
    if (r < size && arr[r] > arr[largest]) largest = r;
    if (largest !== i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      heapify(size, largest);
    }
  }
  // Build max heap
  for (let i = Math.floor(n/2) - 1; i >= 0; i--) heapify(n, i);
  // Extract elements
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    heapify(i, 0);
  }
  return arr;
}

console.log('\\n=== Heap Sort ===');
console.log(heapSort([38, 27, 43, 3, 9, 82, 10]));

// 4. Dutch National Flag (Sort 0s, 1s, 2s)
function sortColors(arr) {
  let lo = 0, mid = 0, hi = arr.length - 1;
  while (mid <= hi) {
    if (arr[mid] === 0) { [arr[lo], arr[mid]] = [arr[mid], arr[lo]]; lo++; mid++; }
    else if (arr[mid] === 1) { mid++; }
    else { [arr[mid], arr[hi]] = [arr[hi], arr[mid]]; hi--; }
  }
  return arr;
}

console.log('\\n=== Dutch National Flag ===');
console.log('Sort [2,0,2,1,1,0]:', sortColors([2,0,2,1,1,0]));

// 5. Counting Sort
function countingSort(arr) {
  const max = Math.max(...arr);
  const count = new Array(max + 1).fill(0);
  for (const x of arr) count[x]++;
  const result = [];
  for (let i = 0; i <= max; i++) {
    for (let j = 0; j < count[i]; j++) result.push(i);
  }
  return result;
}

console.log('\\n=== Counting Sort ===');
console.log(countingSort([4, 2, 2, 8, 3, 3, 1]));

// Timing comparison
console.log('\\n=== Performance (10000 elements) ===');
const big = Array.from({length: 10000}, () => Math.random() * 10000 | 0);

let t = performance.now();
mergeSort([...big]);
console.log('Merge sort:', (performance.now() - t).toFixed(2), 'ms');

t = performance.now();
quickSort([...big]);
console.log('Quick sort:', (performance.now() - t).toFixed(2), 'ms');

t = performance.now();
[...big].sort((a, b) => a - b);
console.log('JS built-in:', (performance.now() - t).toFixed(2), 'ms');
`,
    content: `
<h1>Sorting Algorithms</h1>
<p>Sorting is the foundation of many algorithms. Understanding the <strong>trade-offs</strong> between sorts — stability, in-place, adaptive — is critical for interview success.</p>

<h2>Merge Sort — O(n log n) Guaranteed</h2>
<pre><code>// C++ — Stable, O(n) extra space
void merge(vector&lt;int&gt;&amp; arr, int lo, int mid, int hi) {
    vector&lt;int&gt; left(arr.begin() + lo, arr.begin() + mid + 1);
    vector&lt;int&gt; right(arr.begin() + mid + 1, arr.begin() + hi + 1);
    int i = 0, j = 0, k = lo;
    while (i &lt; (int)left.size() &amp;&amp; j &lt; (int)right.size())
        arr[k++] = (left[i] &lt;= right[j]) ? left[i++] : right[j++];
    while (i &lt; (int)left.size()) arr[k++] = left[i++];
    while (j &lt; (int)right.size()) arr[k++] = right[j++];
}

void mergeSort(vector&lt;int&gt;&amp; arr, int lo, int hi) {
    if (lo &gt;= hi) return;
    int mid = lo + (hi - lo) / 2;
    mergeSort(arr, lo, mid);
    mergeSort(arr, mid + 1, hi);
    merge(arr, lo, mid, hi);
}</code></pre>

<h2>Quick Sort — O(n log n) Average</h2>
<pre><code>// C++ — In-place, NOT stable
// Lomuto partition
int partition(vector&lt;int&gt;&amp; arr, int lo, int hi) {
    int pivot = arr[hi], i = lo;
    for (int j = lo; j &lt; hi; j++)
        if (arr[j] &lt; pivot) swap(arr[i++], arr[j]);
    swap(arr[i], arr[hi]);
    return i;
}

// Hoare partition (more efficient — fewer swaps)
int hoarePartition(vector&lt;int&gt;&amp; arr, int lo, int hi) {
    int pivot = arr[lo + (hi - lo) / 2];
    int i = lo - 1, j = hi + 1;
    while (true) {
        do { i++; } while (arr[i] &lt; pivot);
        do { j--; } while (arr[j] &gt; pivot);
        if (i &gt;= j) return j;
        swap(arr[i], arr[j]);
    }
}

void quickSort(vector&lt;int&gt;&amp; arr, int lo, int hi) {
    if (lo &gt;= hi) return;
    int p = partition(arr, lo, hi);
    quickSort(arr, lo, p - 1);
    quickSort(arr, p + 1, hi);
}

// Randomized pivot to avoid O(n^2) worst case
int randomPartition(vector&lt;int&gt;&amp; arr, int lo, int hi) {
    int r = lo + rand() % (hi - lo + 1);
    swap(arr[r], arr[hi]);
    return partition(arr, lo, hi);
}</code></pre>

<h2>Heap Sort — O(n log n) In-Place</h2>
<pre><code>// C++ — In-place, NOT stable
void heapify(vector&lt;int&gt;&amp; arr, int n, int i) {
    int largest = i, l = 2*i+1, r = 2*i+2;
    if (l &lt; n &amp;&amp; arr[l] &gt; arr[largest]) largest = l;
    if (r &lt; n &amp;&amp; arr[r] &gt; arr[largest]) largest = r;
    if (largest != i) {
        swap(arr[i], arr[largest]);
        heapify(arr, n, largest);
    }
}
void heapSort(vector&lt;int&gt;&amp; arr) {
    int n = arr.size();
    for (int i = n/2-1; i &gt;= 0; i--) heapify(arr, n, i);
    for (int i = n-1; i &gt; 0; i--) {
        swap(arr[0], arr[i]);
        heapify(arr, i, 0);
    }
}</code></pre>

<h2>Dutch National Flag — Sort 0s, 1s, 2s in One Pass</h2>
<pre><code>// C++ — O(n) time, O(1) space
void sortColors(vector&lt;int&gt;&amp; nums) {
    int lo = 0, mid = 0, hi = nums.size() - 1;
    while (mid &lt;= hi) {
        if (nums[mid] == 0) swap(nums[lo++], nums[mid++]);
        else if (nums[mid] == 1) mid++;
        else swap(nums[mid], nums[hi--]);
    }
}
// Three regions: [0..lo-1]=0s, [lo..mid-1]=1s, [hi+1..n-1]=2s
// mid..hi = unknown</code></pre>

<h2>C++ STL Sort</h2>
<pre><code>// std::sort uses IntroSort (quicksort + heapsort + insertion sort)
// O(n log n) guaranteed, in-place, NOT stable

sort(arr.begin(), arr.end());                    // ascending
sort(arr.begin(), arr.end(), greater&lt;int&gt;());    // descending
sort(arr.begin(), arr.end(), [](int a, int b) {  // custom
    return abs(a) &lt; abs(b);
});

// stable_sort: guaranteed stable, O(n log n), uses O(n) extra space
stable_sort(arr.begin(), arr.end());

// partial_sort: sort first k elements, O(n log k)
partial_sort(arr.begin(), arr.begin() + k, arr.end());

// nth_element: QuickSelect, O(n) average
nth_element(arr.begin(), arr.begin() + k, arr.end());</code></pre>

<h2>Sorting Algorithm Comparison</h2>
<table>
<tr><th>Algorithm</th><th>Best</th><th>Average</th><th>Worst</th><th>Space</th><th>Stable</th><th>In-place</th></tr>
<tr><td>Merge Sort</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n)</td><td>Yes</td><td>No</td></tr>
<tr><td>Quick Sort</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n&sup2;)</td><td>O(log n)</td><td>No</td><td>Yes</td></tr>
<tr><td>Heap Sort</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n log n)</td><td>O(1)</td><td>No</td><td>Yes</td></tr>
<tr><td>Insertion Sort</td><td>O(n)</td><td>O(n&sup2;)</td><td>O(n&sup2;)</td><td>O(1)</td><td>Yes</td><td>Yes</td></tr>
<tr><td>Counting Sort</td><td colspan="3">O(n + k)</td><td>O(k)</td><td>Yes</td><td>No</td></tr>
<tr><td>Radix Sort</td><td colspan="3">O(d*(n + k))</td><td>O(n + k)</td><td>Yes</td><td>No</td></tr>
</table>

<div class="qa-block">
<div class="qa-q">Q: Why is quicksort preferred over mergesort in practice?</div>
<div class="qa-a">Quicksort has better <strong>cache locality</strong> (accesses contiguous memory), smaller constant factors, and is <strong>in-place</strong> (O(log n) stack vs O(n) auxiliary for merge sort). The O(n&sup2;) worst case is avoided with randomized pivot (IntroSort switches to heapsort if recursion gets too deep). However, merge sort is preferred when <strong>stability</strong> is required or for <strong>linked lists</strong> (no random access, merge is O(1) extra space).</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: Sort an array of 0s, 1s, and 2s in one pass.</div>
<div class="qa-a">Use the <strong>Dutch National Flag algorithm</strong> with three pointers: lo (boundary of 0s), mid (current), hi (boundary of 2s). If nums[mid]=0, swap with lo and advance both. If 1, advance mid. If 2, swap with hi and decrement hi (don't advance mid since swapped element is unexamined). One pass, O(n) time, O(1) space.</div>
</div>
`
  },

  {
    id: 'dsa-binary-search',
    title: 'Binary Search Patterns',
    category: 'Sorting & Searching',
    starterCode: `// Binary Search Patterns — JavaScript Implementations
// ====================================================

// 1. Standard Binary Search
function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (arr[mid] === target) return mid;
    else if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

console.log('=== Standard Binary Search ===');
console.log('[1,3,5,7,9,11], find 7:', binarySearch([1,3,5,7,9,11], 7));

// 2. Lower Bound (first element >= target)
function lowerBound(arr, target) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

console.log('\\n=== Lower / Upper Bound ===');
console.log('[1,2,2,2,3,4], lower_bound(2):', lowerBound([1,2,2,2,3,4], 2));

// 3. Upper Bound (first element > target)
function upperBound(arr, target) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (arr[mid] <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
console.log('[1,2,2,2,3,4], upper_bound(2):', upperBound([1,2,2,2,3,4], 2));

// 4. Search in Rotated Sorted Array
function searchRotated(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) { // left half sorted
      if (target >= nums[lo] && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else { // right half sorted
      if (target > nums[mid] && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}

console.log('\\n=== Rotated Array Search ===');
console.log('[4,5,6,7,0,1,2], find 0:', searchRotated([4,5,6,7,0,1,2], 0));

// 5. Find Minimum in Rotated Sorted Array
function findMin(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] > nums[hi]) lo = mid + 1;
    else hi = mid;
  }
  return nums[lo];
}

console.log('Min in [4,5,6,7,0,1,2]:', findMin([4,5,6,7,0,1,2]));

// 6. Peak Element
function findPeakElement(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] > nums[mid + 1]) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

console.log('\\n=== Peak Element ===');
console.log('[1,2,3,1] peak at index:', findPeakElement([1,2,3,1]));

// 7. Binary Search on Answer: Split Array Largest Sum
function splitArray(nums, k) {
  let lo = Math.max(...nums), hi = nums.reduce((a,b) => a+b, 0);
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    // Can we split into k parts where each part sum <= mid?
    let parts = 1, currentSum = 0;
    for (const num of nums) {
      if (currentSum + num > mid) { parts++; currentSum = num; }
      else currentSum += num;
    }
    if (parts <= k) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

console.log('\\n=== Binary Search on Answer ===');
console.log('[7,2,5,10,8], k=2, min largest sum:', splitArray([7,2,5,10,8], 2));

// 8. Median of Two Sorted Arrays
function findMedianSortedArrays(nums1, nums2) {
  if (nums1.length > nums2.length) [nums1, nums2] = [nums2, nums1];
  const m = nums1.length, n = nums2.length;
  let lo = 0, hi = m;
  while (lo <= hi) {
    const i = lo + ((hi - lo) >> 1);
    const j = Math.floor((m + n + 1) / 2) - i;
    const left1 = i > 0 ? nums1[i-1] : -Infinity;
    const right1 = i < m ? nums1[i] : Infinity;
    const left2 = j > 0 ? nums2[j-1] : -Infinity;
    const right2 = j < n ? nums2[j] : Infinity;
    if (left1 <= right2 && left2 <= right1) {
      if ((m + n) % 2 === 1) return Math.max(left1, left2);
      return (Math.max(left1, left2) + Math.min(right1, right2)) / 2;
    }
    if (left1 > right2) hi = i - 1;
    else lo = i + 1;
  }
  return 0;
}

console.log('\\n=== Median of Two Sorted Arrays ===');
console.log('[1,3] and [2]:', findMedianSortedArrays([1,3], [2]));
console.log('[1,2] and [3,4]:', findMedianSortedArrays([1,2], [3,4]));
`,
    content: `
<h1>Binary Search Patterns</h1>
<p>Binary search extends far beyond "find element in sorted array." Master these patterns and you can solve problems that don't even look like binary search at first glance.</p>

<h2>Binary Search Templates</h2>
<pre><code>// Template 1: Standard — find exact target
int binarySearch(vector&lt;int&gt;&amp; arr, int target) {
    int lo = 0, hi = arr.size() - 1;
    while (lo &lt;= hi) {
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] &lt; target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1; // not found
}

// Template 2: Left-biased — find first element &gt;= target (lower_bound)
int lowerBound(vector&lt;int&gt;&amp; arr, int target) {
    int lo = 0, hi = arr.size(); // hi = arr.size(), NOT arr.size()-1
    while (lo &lt; hi) {           // lo &lt; hi, NOT lo &lt;= hi
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] &lt; target) lo = mid + 1;
        else hi = mid;           // hi = mid, NOT mid - 1
    }
    return lo; // first position where arr[lo] &gt;= target
}

// Template 3: Right-biased — find last element &lt;= target
int upperBound(vector&lt;int&gt;&amp; arr, int target) {
    int lo = 0, hi = arr.size();
    while (lo &lt; hi) {
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] &lt;= target) lo = mid + 1;
        else hi = mid;
    }
    return lo; // first position where arr[lo] &gt; target
}

// C++ STL:
auto it1 = lower_bound(arr.begin(), arr.end(), target);
auto it2 = upper_bound(arr.begin(), arr.end(), target);
// Count occurrences of target:
int count = upper_bound(...) - lower_bound(...);</code></pre>

<h2>Search in Rotated Sorted Array</h2>
<pre><code>// C++ — O(log n)
int search(vector&lt;int&gt;&amp; nums, int target) {
    int lo = 0, hi = nums.size() - 1;
    while (lo &lt;= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) return mid;
        if (nums[lo] &lt;= nums[mid]) { // left half sorted
            if (target &gt;= nums[lo] &amp;&amp; target &lt; nums[mid])
                hi = mid - 1;
            else lo = mid + 1;
        } else { // right half sorted
            if (target &gt; nums[mid] &amp;&amp; target &lt;= nums[hi])
                lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}

// [4, 5, 6, 7, 0, 1, 2]  target=0
//  lo       mid       hi
// left half [4,5,6,7] sorted, 0 not in [4,7] -&gt; go right
//              lo mid  hi
// right half [0,1,2] sorted, 0 in [0,2] -&gt; go left
// Found at index 4</code></pre>

<h2>Find Minimum in Rotated Array</h2>
<pre><code>// C++ — O(log n)
int findMin(vector&lt;int&gt;&amp; nums) {
    int lo = 0, hi = nums.size() - 1;
    while (lo &lt; hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] &gt; nums[hi]) lo = mid + 1; // min is in right half
        else hi = mid;                            // min is mid or left
    }
    return nums[lo];
}</code></pre>

<h2>Binary Search on Answer</h2>
<p>When the answer space is monotonic (if answer x works, all larger/smaller also work), binary search on the answer value.</p>
<pre><code>// Split Array Largest Sum — O(n log S) where S = sum of array
int splitArray(vector&lt;int&gt;&amp; nums, int k) {
    int lo = *max_element(nums.begin(), nums.end());
    int hi = accumulate(nums.begin(), nums.end(), 0);

    while (lo &lt; hi) {
        int mid = lo + (hi - lo) / 2;
        // Can we split into &lt;= k parts, each sum &lt;= mid?
        int parts = 1, currentSum = 0;
        for (int num : nums) {
            if (currentSum + num &gt; mid) {
                parts++;
                currentSum = num;
            } else {
                currentSum += num;
            }
        }
        if (parts &lt;= k) hi = mid;   // try smaller max
        else lo = mid + 1;           // need larger max
    }
    return lo;
}

// Answer space: [max(arr), sum(arr)]
// Monotonic: if we can split with max_sum = X, we can with any Y &gt; X</code></pre>

<h2>Median of Two Sorted Arrays — O(log min(m,n))</h2>
<pre><code>// C++ — Binary search on partition position
double findMedianSortedArrays(vector&lt;int&gt;&amp; nums1, vector&lt;int&gt;&amp; nums2) {
    if (nums1.size() &gt; nums2.size()) swap(nums1, nums2);
    int m = nums1.size(), n = nums2.size();
    int lo = 0, hi = m;
    while (lo &lt;= hi) {
        int i = lo + (hi - lo) / 2;
        int j = (m + n + 1) / 2 - i;
        int left1  = (i &gt; 0) ? nums1[i-1] : INT_MIN;
        int right1 = (i &lt; m) ? nums1[i]   : INT_MAX;
        int left2  = (j &gt; 0) ? nums2[j-1] : INT_MIN;
        int right2 = (j &lt; n) ? nums2[j]   : INT_MAX;
        if (left1 &lt;= right2 &amp;&amp; left2 &lt;= right1) {
            if ((m + n) % 2 == 1) return max(left1, left2);
            return (max(left1, left2) + min(right1, right2)) / 2.0;
        }
        if (left1 &gt; right2) hi = i - 1;
        else lo = i + 1;
    }
    return 0.0;
}</code></pre>

<h2>Pattern Reference</h2>
<table>
<tr><th>Problem</th><th>Pattern</th><th>Search Space</th><th>Time</th></tr>
<tr><td>Find element</td><td>Standard</td><td>Array indices</td><td>O(log n)</td></tr>
<tr><td>First/last occurrence</td><td>Lower/upper bound</td><td>Array indices</td><td>O(log n)</td></tr>
<tr><td>Rotated array</td><td>Modified standard</td><td>Array indices</td><td>O(log n)</td></tr>
<tr><td>Peak element</td><td>Gradient descent</td><td>Array indices</td><td>O(log n)</td></tr>
<tr><td>Split array largest sum</td><td>Search on answer</td><td>[max, sum]</td><td>O(n log S)</td></tr>
<tr><td>Koko eating bananas</td><td>Search on answer</td><td>[1, max]</td><td>O(n log M)</td></tr>
<tr><td>Median of two arrays</td><td>Partition</td><td>[0, min(m,n)]</td><td>O(log min(m,n))</td></tr>
</table>

<div class="qa-block">
<div class="qa-q">Q: Find minimum in rotated sorted array.</div>
<div class="qa-a">Compare mid with hi: if nums[mid] &gt; nums[hi], the minimum is in the right half (lo = mid + 1). Otherwise, the minimum is at mid or left (hi = mid). This works because the unsorted half always contains the minimum. Time: O(log n).</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: Explain binary search on answer with "split array largest sum."</div>
<div class="qa-a">The answer (max subarray sum) lies in [max(arr), sum(arr)]. For a given candidate answer mid, greedily check if we can split into at most k subarrays each with sum &lt;= mid. If yes, try smaller (hi = mid). If no, need larger (lo = mid + 1). The feasibility check is monotonic: if mid works, any larger value also works. Time: O(n log S).</div>
</div>

<div class="warning-note">Common binary search bugs: (1) Use <code>lo + (hi - lo) / 2</code> instead of <code>(lo + hi) / 2</code> to prevent integer overflow. (2) Watch the loop condition: <code>lo &lt;= hi</code> for exact search, <code>lo &lt; hi</code> for boundary search. (3) Be careful with <code>hi = mid</code> vs <code>hi = mid - 1</code> to avoid infinite loops.</div>
`
  },

  {
    id: 'dsa-complexity',
    title: 'Time & Space Complexity Analysis',
    category: 'Sorting & Searching',
    starterCode: `// Time & Space Complexity — Interactive Demonstrations
// =====================================================

// 1. Visualize different growth rates
function measureGrowth(n) {
  const ops = {
    'O(1)': 1,
    'O(log n)': Math.ceil(Math.log2(n)),
    'O(n)': n,
    'O(n log n)': Math.ceil(n * Math.log2(n)),
    'O(n^2)': n * n,
  };
  return ops;
}

console.log('=== Growth Rate Comparison ===');
for (const n of [10, 100, 1000, 10000]) {
  const ops = measureGrowth(n);
  console.log('n=' + n + ':');
  for (const [name, val] of Object.entries(ops)) {
    console.log('  ' + name.padEnd(12) + val.toLocaleString());
  }
}

// 2. Amortized Analysis: Dynamic Array
class DynamicArray {
  constructor() { this.data = new Array(1); this.size = 0; this.cap = 1; this.totalCopies = 0; }
  push(val) {
    if (this.size === this.cap) {
      const newData = new Array(this.cap * 2);
      for (let i = 0; i < this.size; i++) { newData[i] = this.data[i]; this.totalCopies++; }
      this.data = newData;
      this.cap *= 2;
    }
    this.data[this.size++] = val;
  }
}

console.log('\\n=== Amortized Analysis: Dynamic Array ===');
const da = new DynamicArray();
for (let i = 0; i < 1000; i++) da.push(i);
console.log('1000 pushes, total copies:', da.totalCopies);
console.log('Average copies per push:', (da.totalCopies / 1000).toFixed(2));
console.log('This demonstrates amortized O(1) per push');

// 3. Complexity of common operations
console.log('\\n=== STL/JS Equivalent Complexities ===');
const complexities = [
  ['Array access', 'O(1)'],
  ['Array push (end)', 'O(1) amortized'],
  ['Array insert (middle)', 'O(n)'],
  ['Array sort', 'O(n log n)'],
  ['Hash map get/set', 'O(1) average'],
  ['Set add/has/delete', 'O(1) average'],
  ['Map (sorted) get/set', 'O(log n)'],
  ['Binary search', 'O(log n)'],
  ['BFS/DFS', 'O(V + E)'],
  ['Heap push/pop', 'O(log n)'],
  ['Heap build', 'O(n)'],
];
complexities.forEach(([op, comp]) =>
  console.log('  ' + op.padEnd(28) + comp)
);

// 4. Recursion stack space demonstration
function fibonacci(n, depth = 0) {
  if (n <= 1) return { val: n, maxDepth: depth };
  const left = fibonacci(n - 1, depth + 1);
  const right = fibonacci(n - 2, depth + 1);
  return {
    val: left.val + right.val,
    maxDepth: Math.max(left.maxDepth, right.maxDepth)
  };
}

console.log('\\n=== Recursion Stack Depth ===');
for (const n of [5, 10, 15, 20]) {
  const result = fibonacci(n);
  console.log('fib(' + n + ') = ' + result.val + ', max stack depth: ' + result.maxDepth);
}
console.log('Note: stack depth = O(n), not O(2^n)');
console.log('The TIME is O(2^n) but SPACE is O(n) due to DFS nature');

// 5. Master Theorem examples
console.log('\\n=== Master Theorem ===');
console.log('T(n) = aT(n/b) + O(n^c)');
console.log('Case 1: c < log_b(a) => O(n^log_b(a))');
console.log('Case 2: c = log_b(a) => O(n^c * log n)');
console.log('Case 3: c > log_b(a) => O(n^c)');
console.log('');
console.log('Binary Search:    T(n) = T(n/2) + O(1)    => O(log n)     [Case 2]');
console.log('Merge Sort:       T(n) = 2T(n/2) + O(n)   => O(n log n)   [Case 2]');
console.log('Karatsuba:        T(n) = 3T(n/2) + O(n)   => O(n^1.585)   [Case 1]');
console.log('Strassen:         T(n) = 7T(n/2) + O(n^2) => O(n^2.807)   [Case 1]');
`,
    content: `
<h1>Time &amp; Space Complexity Analysis</h1>
<p>Complexity analysis is the foundation of algorithm interviews. Every solution you present must include its <strong>time and space complexity</strong> with justification.</p>

<h2>Asymptotic Notations</h2>
<ul>
<li><strong>Big O (O)</strong>: Upper bound — worst case. "At most this fast."</li>
<li><strong>Big Omega (&Omega;)</strong>: Lower bound — best case. "At least this fast."</li>
<li><strong>Big Theta (&Theta;)</strong>: Tight bound — both upper and lower. "Exactly this fast."</li>
</ul>
<p>In interviews, we almost always discuss <strong>Big O</strong> (worst case) unless specifically asked.</p>

<h2>Common Complexities</h2>
<pre><code>// Growth rates (ascending):
// O(1) &lt; O(log n) &lt; O(sqrt(n)) &lt; O(n) &lt; O(n log n) &lt; O(n^2) &lt; O(2^n) &lt; O(n!)

// n = 1,000,000:
// O(1)       = 1
// O(log n)   = 20
// O(n)       = 1,000,000
// O(n log n) = 20,000,000
// O(n^2)     = 1,000,000,000,000   (TLE at ~10^8 ops/sec)
// O(2^n)     = impossible for n&gt;30</code></pre>

<h2>Analyzing Loops</h2>
<pre><code>// Single loop: O(n)
for (int i = 0; i &lt; n; i++) { ... }

// Nested loops: O(n^2)
for (int i = 0; i &lt; n; i++)
    for (int j = 0; j &lt; n; j++) { ... }

// Logarithmic: O(log n)
for (int i = 1; i &lt; n; i *= 2) { ... }  // doubles each time
for (int i = n; i &gt; 0; i /= 2) { ... }  // halves each time

// n * log n:
for (int i = 0; i &lt; n; i++)          // O(n)
    for (int j = 1; j &lt; n; j *= 2)   // O(log n)
        { ... }

// Tricky: O(n) NOT O(n^2)
for (int i = 0; i &lt; n; i++)
    for (int j = i; j &lt; n; j += n)    // inner runs once per i
        { ... }

// Two pointers (sliding window): O(n)
// Even though there's a while inside for,
// each element enters/leaves window at most once
int left = 0;
for (int right = 0; right &lt; n; right++) {
    while (/* condition */) left++;     // left moves at most n total
}</code></pre>

<h2>Recursion Analysis</h2>
<pre><code>// Master Theorem: T(n) = aT(n/b) + O(n^c)
// Compare c with log_b(a):
//   Case 1: c &lt; log_b(a) =&gt; T(n) = O(n^(log_b(a)))
//   Case 2: c = log_b(a) =&gt; T(n) = O(n^c * log n)
//   Case 3: c &gt; log_b(a) =&gt; T(n) = O(n^c)

// Examples:
// Binary Search:  T(n) = 1*T(n/2) + O(1) =&gt; a=1,b=2,c=0
//                 log_2(1) = 0 = c  =&gt; Case 2 =&gt; O(log n)

// Merge Sort:     T(n) = 2*T(n/2) + O(n) =&gt; a=2,b=2,c=1
//                 log_2(2) = 1 = c  =&gt; Case 2 =&gt; O(n log n)

// Fibonacci:      T(n) = T(n-1) + T(n-2) + O(1)
//                 Not divide-and-conquer; use recursion tree
//                 Each call branches 2x =&gt; O(2^n) time
//                 Stack depth = O(n) space (DFS)</code></pre>

<h2>Amortized Analysis</h2>
<pre><code>// Dynamic Array push_back:
// Most pushes: O(1) — just write to next slot
// Occasional resize: O(n) — copy all elements, double capacity
//
// Sizes at resize: 1, 2, 4, 8, ..., n/2
// Total copies: 1 + 2 + 4 + ... + n/2 = n - 1
// Over n pushes: (n - 1) / n ~ O(1) amortized per push

// Union-Find (with path compression + union by rank):
// Single operation: O(log n) worst case
// Amortized per operation: O(alpha(n)) ~ O(1)
// alpha(n) = inverse Ackermann, &lt; 5 for any practical n</code></pre>

<h2>Space Complexity</h2>
<pre><code>// Stack frames count as space:
void recurse(int n) {
    if (n == 0) return;
    recurse(n - 1);  // O(n) stack space
}

// DFS on tree: O(h) space where h = height
// BFS on tree: O(w) space where w = max width

// Important distinction:
// Recursive DFS on balanced tree: O(log n) space
// Recursive DFS on skewed tree: O(n) space
// Iterative with explicit stack: same space, no stack overflow risk

// Auxiliary space vs Total space:
// Merge sort: O(n) auxiliary (temp array) + O(log n) stack = O(n) total
// Quick sort: O(1) auxiliary + O(log n) stack = O(log n) total</code></pre>

<h2>STL Complexity Reference</h2>
<table>
<tr><th>Operation</th><th>vector</th><th>list</th><th>map</th><th>unordered_map</th></tr>
<tr><td>Access [i]</td><td>O(1)</td><td>O(n)</td><td>O(log n)</td><td>O(1) avg</td></tr>
<tr><td>Insert front</td><td>O(n)</td><td>O(1)</td><td>-</td><td>-</td></tr>
<tr><td>Insert back</td><td>O(1) amort.</td><td>O(1)</td><td>-</td><td>-</td></tr>
<tr><td>Insert middle</td><td>O(n)</td><td>O(1)*</td><td>O(log n)</td><td>O(1) avg</td></tr>
<tr><td>Find</td><td>O(n)</td><td>O(n)</td><td>O(log n)</td><td>O(1) avg</td></tr>
<tr><td>Delete</td><td>O(n)</td><td>O(1)*</td><td>O(log n)</td><td>O(1) avg</td></tr>
<tr><td>Sort</td><td>O(n log n)</td><td>O(n log n)</td><td>Sorted</td><td>N/A</td></tr>
</table>
<p>* list insert/delete is O(1) if you have an iterator; finding the position is O(n).</p>

<h2>Common Pitfalls</h2>
<ul>
<li><strong>String concatenation in a loop</strong>: s += char is O(n) per operation in C++ (creates new string), making the loop O(n&sup2;). Use string builder or reserve().</li>
<li><strong>Nested loops ≠ always O(n&sup2;)</strong>: Sliding window has nested loops but is O(n) total because each element is processed once.</li>
<li><strong>Hash map worst case</strong>: O(n) per operation due to collisions. Use when average case suffices.</li>
<li><strong>Recursion space</strong>: Don't forget the call stack. Fibonacci has O(n) space, not O(1).</li>
</ul>

<div class="qa-block">
<div class="qa-q">Q: What is the time complexity of building a heap?</div>
<div class="qa-a"><strong>O(n)</strong>, NOT O(n log n). Intuition: most nodes are near the bottom and require very little sifting. Mathematically, sum of (n/2^(h+1)) * h for h from 0 to log n = O(n). This is the sift-down (bottom-up) approach. The sift-up (top-down, inserting one by one) IS O(n log n). Build heap always uses sift-down.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: Explain amortized O(1) for dynamic array push_back.</div>
<div class="qa-a">Most push operations are O(1) — just write to the next slot. When the array is full, we double the capacity and copy all n elements — O(n). But this happens after n cheap operations. Total cost for n pushes: n (writes) + 1 + 2 + 4 + ... + n/2 (copies) = n + (n-1) ≈ 2n. Amortized cost per push: 2n/n = O(1). The key insight: expensive operations are rare enough that they average out.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: What is the space complexity of recursive vs iterative DFS?</div>
<div class="qa-a">Both are O(h) where h is the maximum depth (tree height or longest path). Recursive DFS uses the call stack; iterative DFS uses an explicit stack. The space is the same, but iterative avoids stack overflow for very deep recursion (e.g., linked-list-like trees with h=n). For balanced trees, h = O(log n).</div>
</div>

<div class="warning-note">In interviews, always state BOTH time and space complexity. A common mistake is optimizing time while ignoring space — e.g., memoization uses O(n) or O(n&sup2;) extra space.</div>
`
  },
];
