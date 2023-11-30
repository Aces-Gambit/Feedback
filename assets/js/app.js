//#region -- GLOBAL --
const BASE_API_URL = 'https://bytegrad.com/course-assets/js/1/api';
const MAX_CHARS = 150;
let fetchSave = [];

const textareaEl = document.querySelector('.form__textarea');
const counterEl = document.querySelector('.counter');
const formEl = document.querySelector('.form');
const feedbackListEl = document.querySelector('.feedbacks');
const hashtagListEl = document.querySelector('.hashtags');
const submitBtnEl = document.querySelector('.submit-btn');
const spinnerEl = document.querySelector('.spinner');

const renderFeedbackItem = feedbackItem => {
    const feedbackItemHTML = `
    <li class="feedback">
        <button class="upvote">
            <i class="fa-solid fa-caret-up upvote__icon"></i>
            <span class="upvote__count">${feedbackItem.upvoteCount}</span>
        </button>
        <section class="feedback__badge">
            <p class="feedback__letter">${feedbackItem.badgeLetter}</p>
        </section>
        <div class="feedback__content">
            <p class="feedback__company">${feedbackItem.company}</p>
            <p class="feedback__text">${feedbackItem.text}</p>
        </div>
        <p class="feedback__date">${feedbackItem.daysAgo === 0 ? 'NEW' : `${feedbackItem.daysAgo}d`}</p>
    </li>
    `;

    //insert feedback item into the DOM
    feedbackListEl.insertAdjacentHTML('beforeend', feedbackItemHTML);
};
//#endregion

//#region -- COUNTER COMPONENT --

const inputHandler = (e) => {
    //determine maximum number of characters
    const maxChars = MAX_CHARS;
    //determine current number of characters
    const currentChars = e.target.value.length;
    //determine remaining number of characters
    const remainingChars = maxChars - currentChars;
    //update the remaining characters counter
    counterEl.textContent = remainingChars;

}

textareaEl.addEventListener('input', inputHandler);

//#endregion

//#region -- FORM COMPONENT --

const showVisualIndicator = (el, className) => {
    el.classList.add(className);
    setTimeout(() => el.classList.remove(className), 2000);
};

const submitHandler = e => {
    //prevent default form submission
    e.preventDefault();

    //get textarea value
    const text = textareaEl.value;

    //validate textarea value (e.g. check if #hashtag is present and text is long enough)
    if (text.includes('#') && text.length >= 5) {
        //show visual indicator
        showVisualIndicator(formEl, 'form--valid');
    } else {
        showVisualIndicator(formEl, 'form--invalid');
        //focus on textarea
        textareaEl.focus();
        //stop function execution
        return;
    }

    //extract info from input field
    const hashtag = text.split(' ').find(word => word.includes('#'));
    //trim specified punctuation from the beginning and end of a string
    const company = hashtag.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    const badgeLetter = company[0].toUpperCase();
    const upvoteCount = 0;
    const daysAgo = 0;

    //create feedback item object
    const feedbackItem = {
        upvoteCount,
        company,
        badgeLetter,
        daysAgo,
        text,
    };
    //render feedback item
    renderFeedbackItem(feedbackItem);
    //send feedback item to server
    fetch(`${BASE_API_URL}/feedbacks`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackItem)
    })
        .then(response => {
            if (!response.ok) {
                console.log('Error: ', response);
                return;
            }
            console.log('Successfully submitted');
        })
        .catch(error => console.log('Error: ', error));
    
    //add feedback item to fetchSave array of objects
    fetchSave.push(feedbackItem);
    //add hashtag to hashtag list
    const hashtagItemHTML = `
    <li class="hashtags__item">
        <button class="hashtag">#${company}</button>
    </li>
    `;
    hashtagListEl.insertAdjacentHTML('beforeend', hashtagItemHTML);
    //reset textarea value
    textareaEl.value = '';
    //blur submit button
    submitBtnEl.blur();
    //reset counter
    counterEl.textContent = MAX_CHARS;
};

formEl.addEventListener('submit', submitHandler);
//#endregion

//#region -- FEEDBACK LIST COMPONENT --
const handleUpvote = e => {
    //get closest upvote button
    upvoteBtnEl = e.closest('.upvote');
    //disable upvote button
    upvoteBtnEl.disabled = true;
    //get upvote count element
    const upvoteCountEl = upvoteBtnEl.querySelector('.upvote__count');
    //get current upvote count
    let upvoteCount = Number(upvoteCountEl.textContent);
    //get new upvote count
    ++upvoteCount;
    //update upvote count element
    upvoteCountEl.textContent = upvoteCount;
    //update the fetchSave array of objects with a keyvalue pair of upvoteCount: number with the new upvoteCount for that feedback item based on matching object text
    fetchSave.forEach(feedbackItem => {
        if (feedbackItem.text === e.closest('.feedback').querySelector('.feedback__text').textContent) {
            feedbackItem.upvoteCount = upvoteCount;
            //add a new keyvalue pair of upvoted: true to the feedback item object;
            feedbackItem.upvoted = true;
        }
    });
};
const handleExpand = e => {
    parentEl = e.closest('.feedback');
    parentEl.classList.toggle('feedback--expand');
};

const clickHandler = e => {
    //get clicked HTML Element
    const clickedEl = e.target;
    //check if clicked element is an upvote button or expand button
    clickedEl.className.includes('upvote') ? handleUpvote(clickedEl) : handleExpand(clickedEl);
};

feedbackListEl.addEventListener('click', clickHandler);

fetch(`${BASE_API_URL}/feedbacks`)
    .then(response => response.json())
    .then(data => {
        //remove loading state
        spinnerEl.remove();
        //Loop through each feedback item
        fetchSave = data.feedbacks; 
        fetchSave.forEach(feedbackItem => renderFeedbackItem(feedbackItem));
    })
    .catch(error => {
        feedbackListEl.textContent = `An error occurred while fetching feedback items. Error Message: ${error.message}`;
    });
//#endregion

//#region -- HASHTAG LIST COMPONENT --
const clickHandlerHashtag = (e) => {
    //get clicked HTML Element
    const clickedEl = e.target;
    //check if clicked element is an hashtag button or hashtags element
    if (clickedEl.className ==='hashtags' || clickedEl.className ==='hashtags__item') return;
    //extract company name from hashtag
    const companyNameFromHashtag = clickedEl.textContent.slice(1).toLowerCase().trim();
    //remove all feedback items from the DOM and re-render them
    feedbackListEl.childNodes.forEach(childNodes => {
        //if childNodes doesn't have either feedback as a class or feedback feedback--expand as a class, return
        if (childNodes.className !== 'feedback' && childNodes.className !== 'feedback feedback--expand') return;
        childNodes.remove();
    });
    fetchSave.forEach(feedbackItem => renderFeedbackItem(feedbackItem));
    //iterate over each feedback item in the list
    feedbackListEl.childNodes.forEach(childNodes => {
        if (childNodes.className !== 'feedback' && childNodes.className !== 'feedback feedback--expand') return;
        
        //get company name from feedback item
        const companyNameFromFeedbackItem = childNodes.querySelector('.feedback__company').textContent.toLowerCase().trim();

        //remove feedback item if company name from hashtag and feedback item do not match
        if (companyNameFromHashtag !== companyNameFromFeedbackItem) {
            childNodes.remove();
        }

        //for each feedback item, check if it has been upvoted in fetchSave array of objects matching object text
        fetchSave.forEach(feedbackItem => {
            if (feedbackItem.text === childNodes.querySelector('.feedback__text').textContent) {
                if (feedbackItem.upvoted) {
                    //if it has been upvoted, disable the upvote button
                    childNodes.querySelector('.upvote').disabled = true;
                }
            }
        });
    });
};
hashtagListEl.addEventListener('click', clickHandlerHashtag);
// #endregion