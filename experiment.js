// Modified by Alex Jago to have four colour choices ([red, blue, green, yellow] : [Z, X, C, V])
//	and four number choices ([3, 4, 5, 6] : [H, J, K, L])
//  and optionally an odd:even choice ([3, 4, 5, 6] : [K, L, K, L])

/* ************************************ */
/* Define helper functions */
/* ************************************ */
function evalAttentionChecks() {
  var check_percent = 1
  if (run_attention_checks) {
    var attention_check_trials = jsPsych.data.getTrialsOfType('attention-check')
    var checks_passed = 0
    for (var i = 0; i < attention_check_trials.length; i++) {
      if (attention_check_trials[i].correct === true) {
        checks_passed += 1
      }
    }
    check_percent = checks_passed / attention_check_trials.length
  }
  return check_percent
}

function assessPerformance() {
  var experiment_data = jsPsych.data.getTrialsOfType('poldrack-multi-stim-multi-response')
  var missed_count = 0
  var trial_count = 0
  var rt_array = []
  var rt = 0
  for (var i = 0; i < experiment_data.length; i++) {
    rt = JSON.parse(experiment_data[i].rt)[0]
    trial_count += 1
    if (rt == -1) {
      missed_count += 1
    } else {
      rt_array.push(rt)
    }
  }
  //calculate average rt
  var avg_rt = -1
  if (rt_array.length !== 0) {
    avg_rt = math.median(rt_array)
  }
  var missed_percent = missed_count/trial_count
  credit_var = (missed_percent < 0.4 && avg_rt > 200)
  jsPsych.data.addDataToLastTrial({"credit_var": credit_var})
}

var getInstructFeedback = function() {
  return '<div class = centerbox><p class = "center-block-text">' +
    feedback_instruct_text + '</p></div>'
}

var randomDraw = function(lst) {
  var index = Math.floor(Math.random() * (lst.length))
  return lst[index]
}

// getStim is a very important function!
// Returns [stim_1, stim_2] and sets a bunch of things in `curr_data`
var getStim = function() {
  var border_i = randomDraw([0, 1, 2, 3]) // get border index
  var number_i = randomDraw([0, 1, 2, 3]) // get inner index
  var stim_box = stim_prefix + path_source + borders[border_i][0] + ' </img></div></div>'
  var stim_num = '<div class = prp_centerbox><div class = "center-text">' +
    inners[number_i] + '</div></div>'
  var stim_both = stim_prefix + path_source + borders[border_i][0] +
    ' </img></div></div><div class = prp_centerbox><div class = "center-text">' +
    inners[number_i] + '</div></div>'

  //update data

  var choice_box = borders[border_i][1];
  var choice_num = inners[number_i];
  var resp_box = choices1[border_i];
  var resp_num = odd_even ? choices2[(number_i % 2) + 2] : choices2[number_i];
  // odd is K [index 2], even is L [index 3]


  switch(stim_modes){ // the `break`s in here shouldn't be necessary
  	case "number":
      curr_data.choice1_stim = choice_num;
      curr_data.choice2_stim = choice_num;
      curr_data.choice1_correct_response = resp_num;
      curr_data.choice2_correct_response = resp_num;
  		return [stim_num, stim_num];
  		break;
  	case "colour":
      curr_data.choice1_stim = choice_box;
      curr_data.choice2_stim = choice_box;
      curr_data.choice1_correct_response = resp_box;
      curr_data.choice2_correct_response = resp_box;
  		return [stim_box, stim_box];
  		break;
	case "both": // both is default; fall through
	default:
    curr_data.choice1_stim = stim_order ? choice_box : choice_num;
    curr_data.choice2_stim = stim_order ? choice_num : choice_box;
    curr_data.choice1_correct_response = stim_order ? resp_box : resp_num;
    curr_data.choice2_correct_response = stim_order ? resp_num : resp_box;
    return (stim_order ? [stim_box, stim_both] : [stim_num, stim_both]);
	  break;
  }
}

var getISI = function() {
    var ISI = ISIs.shift()
    curr_data.ISI = ISI
    return [ISI, 2000 - ISI]
  }

/*
In this task the participant can make two responses - one to a go/nogo stim and one to a 2AFC task. If only one response is made
and it is one of the 2AFC responses, the person is assumed to have "no-goed" to the go/nogo stim.
*/
var getFB = function() {
  var data = jsPsych.data.getLastTrialData()
  var keys = JSON.parse(data.key_presses)
  var rts = JSON.parse(data.rt)
  var tooShort = false
  var choice1FB = ''
  var choice2FB = ''

  console.log("Debug: ", curr_data.choice1_stim, curr_data.choice2_stim);

  var squareReminder = 'Remember: if the square is ' + borders[0][1] + ' press the "Z" key.<br> If the square is ' + borders[1][1] + ' press the "X" key.<br>' +
  							'If the square is ' + borders[2][1] + ' press the "C" key.<br> If the square is ' + borders[3][1] + ' press the "V" key.<br>'

  var numberReminder = 'Remember: if the number is ' + inners[0] + ' press the "H" key.<br> If the number is ' + inners[1] + ' press the "J" key.<br>' +
  							'If the number is ' + inners[2] + ' press the "K" key.<br> If the number is ' + inners[3] + ' press the "L" key.<br>'

  var oddEvenReminder = 'Remember: if the number is odd press the "K" key. If the number is even press the "L" key.'

  var orderReminder = 'Be sure to respond to the stimuli in the order they appear.'

    // If the person only responded once
  if (rts[0] !== -1 && rts[1] === -1) {
    if (jQuery.inArray(keys[0], (stim_order ? choices1 : choices2)) === -1) {
      choice1FB = 'You did not respond to the ' + (stim_order ? 'colored square!' : 'number!')
      if (rts[0] < data.ISI + 50) {
        tooShort = true //if they respond to the number before they should be able to
      }
      if (keys[0] === data.choice2_correct_response) {
        choice2FB = 'You responded correctly to the ' + (stim_order ? 'number!' : 'coloured square!')
      } else {
        choice2FB = 'You did not respond correctly to the ' + (stim_order ? 'number. ' + (odd_even ? oddEvenReminder : numberReminder) : 'colored square. ' + squareReminder) + orderReminder
      }
    } else if (jQuery.inArray(keys[0], (stim_order ? choices2 : choices1)) === -1) {
      choice2FB = 'You did not respond to the ' + (stim_order ? 'number!' : 'coloured square!')
      if (keys[0] === data.choice1_correct_response) {
        choice1FB = 'You responded correctly to the ' + (stim_order ? 'colored square!' : 'number!')
      } else {
        choice1FB = 'You did not respond correctly to the ' + (stim_order ? 'colored square. ' + squareReminder : 'number. ' + (odd_even ? oddEvenReminder : numberReminder)) + orderReminder
      }
    }
  } else if (rts[0] !== -1 && rts[1] !== -1) { //if the person responded twice
    if (rts[1] < data.ISI + 50) {
      tooShort = true //if they respond to the number before they should be able to
    }
    if (keys[0] === data.choice1_correct_response) {
      choice1FB = 'You responded correctly to the ' + (stim_order ? 'colored square!' : 'number!')
    } else {
      choice1FB = 'You did not respond correctly to the ' + (stim_order ? 'colored square. ' + squareReminder : 'number. ' + (odd_even ? oddEvenReminder : numberReminder)) + orderReminder
    }
    if (keys[1] === data.choice2_correct_response) {
      choice2FB = 'You responded correctly to the ' + (stim_order ? 'number!' : 'coloured square! ')
    } else {
      choice2FB = 'You did not respond correctly to the ' + (stim_order ? 'number. ' + (odd_even ? oddEvenReminder : numberReminder) : 'coloured square. ' + squareReminder) + orderReminder
    }
  } else { //if they didn't respond
    choice1FB = 'Respond to the square and number!'
  }
  if (tooShort) {
    return '<div class = prp_centerbox><p class = "center-block-text">You pressed a key before any stimulus was on the screen! Wait for it before responding!</p><p class = "center-block-text">Press any key to continue</p></div>'
  } else {
  	switch(stim_modes){
  		case "number":
  			return '<div class = prp_centerbox><p class = "center-block-text">' + choice1FB +
  				'</p><p class = "center-block-text">Press any key to continue</p></div>';
  			break;
  		case "colour":
  			return '<div class = prp_centerbox><p class = "center-block-text">' + choice2FB +
  				'</p><p class = "center-block-text">Press any key to continue</p></div>';
  				break;
  		case "both":
  		default:
			return '<div class = prp_centerbox><p class = "center-block-text">' + choice1FB +
			  '</p><p class = "center-block-text">' + choice2FB +
        //
        '</p><p class = "center-block-text">' + 'DEBUG: stim_modes = ' + stim_modes +
        '; stim_order = ' + (stim_order ? 'true':'false') + '; odd_even = ' + (odd_even ? 'true' : 'false') + '.' +
        //
        '</p><p class = "center-block-text">Press any key to continue</p></div>';
			break;
    }
  }
}



/* ************************************ */
/* Define experimental variables */
/* ************************************ */
// generic task variables
var run_attention_checks = false
var attention_check_thresh = 0.45
var sumInstructTime = 0 //ms
var instructTimeThresh = 0 ///in seconds
var credit_var = true

// task specific variables
var stim_modes = "both"; // ["both", "colour", "number"]
var stim_order = true; // True: box then number. False: number then box.
var odd_even = false; // If true, then numbers are to be responded to as odd or even. If false, as numbers.

var stim_mutex = true;
var stim_order_check = "not changed";

var practice_len = 16
var exp_len = 16
var current_trial = 0
var choices1 = [90,88,67,86] // z,x,c,v
var choices2 = [72,74,75,76] // h,j,k,l
var choices = choices1.concat(choices2)
var practice_ISIs = jsPsych.randomization.repeat([50, 200, 400, 800],
  exp_len/4) // ISI: inter stimulus interval
  // original : [50, 150, 300, 800]
  // As requested: [50, 200, 400, 800]
var ISIs = practice_ISIs.concat(jsPsych.randomization.repeat([50, 200, 400, 800], exp_len * 3 / 4))

var curr_data = {
    ISI: '',
    choice1_stim: '',
    choice2_stim: '',
    choice1_correct_response: '',
    choice2_correct_response: '',
  }
  //stim variables
var path_source = 'images/'
var stim_prefix = '<div class = prp_centerbox><div class = prp_stimBox><img class = prpStim src ='
  // border color relates to the go-nogo task. The subject should GO to the first two borders in the following array:
var borders = [['1_border.png', 'red'], ['2_border.png', 'blue'],
	['3_border.png', 'green'], ['4_border.png', 'yellow'] ]
  // inner number reflect the choice RT.
var inners = [3,4,5,6]

//These are just for the initial instruction.
var box1 = '<div class = prp_far-left-instruction><div class = prp_stimBox><img class = prpStim src = ' +
  path_source + borders[0][0] + ' </img></div></div>'
var box2 =
  '<div class = prp_centre-left-instruction><div class = prp_stimBox><img class = prpStim src = ' +
  path_source + borders[1][0] + ' </img></div></div>'
var box3 =
  '<div class = prp_centre-right-instruction><div class = prp_stimBox><img class = prpStim src = ' +
  path_source + borders[2][0] + ' </img></div></div>'
var box4 =
  '<div class = prp_far-right-instruction><div class = prp_stimBox><img class = prpStim src = ' +
  path_source + borders[3][0] + ' </img></div></div>'

var box_number1 =
  '<div class = prp_far-left-instruction><div class = prp_stimBox><img class = prpStim src = ' +
  path_source + borders[0][0] + ' </img></div></div>' +
  '<div class = prp_far-left-instruction><div class = "center-text">' + inners[0] +
  '</div></div>'
var box_number2 =
  '<div class = prp_centre-left-instruction><div class = prp_stimBox><img class = prpStim src = ' +
  path_source + borders[1][0] + ' </img></div></div>' +
  '<div class = prp_centre-left-instruction><div class = "center-text">' + inners[1] +
  '</div></div>'
var box_number3 =
  '<div class = prp_centre-right-instruction><div class = prp_stimBox><img class = prpStim src = ' +
  path_source + borders[2][0] + ' </img></div></div>' +
  '<div class = prp_centre-right-instruction><div class = "center-text">' + inners[2] +
  '</div></div>'
var box_number4 =
  '<div class = prp_far-right-instruction><div class = prp_stimBox><img class = prpStim src = ' +
  path_source + borders[3][0] + ' </img></div></div>' +
  '<div class = prp_far-right-instruction><div class = "center-text">' + inners[3] +
  '</div></div>'


/* ************************************ */
/* Set up jsPsych blocks */
/* ************************************ */
// Set up attention check node
var attention_check_block = {
  type: 'attention-check',
  data: {
    trial_id: 'attention_check'
  },
  timing_response: 180000,
  response_ends_trial: true,
  timing_post_trial: 200
}

var attention_node = {
  timeline: [attention_check_block],
  conditional_function: function() {
    return run_attention_checks
  }
}

//Set up post task questionnaire
var post_task_block = {
   type: 'survey-text',
   data: {
       trial_id: "post task questions"
   },
   questions: ['<p class = center-block-text style = "font-size: 20px">Please summarize what you were asked to do in this task.</p>',
              '<p class = center-block-text style = "font-size: 20px">Do you have any comments about this task?</p>'],
   rows: [15, 15],
   columns: [60,60]
};

/* define static blocks */
var end_block = {
  type: 'poldrack-text',
  timing_response: 180000,
  data: {
    trial_id: 'end',
    exp_id: 'psychological_refractory_period_two_choices'
  },
  text: '<div class = prp_centerbox><p class = "center-block-text">Thanks for completing this task!</p><p class = "center-block-text">Press <strong>enter</strong> to continue.</p></div>',
  cont_key: [13],
  timing_post_trial: 0,
  on_finish: assessPerformance
};

var feedback_instruct_text =
  'Welcome to the experiment. This experiment will take about 12 minutes. Press <strong>enter</strong> to begin.'
var feedback_instruct_block = {
  type: 'poldrack-text',
  data: {
    trial_id: 'instruction'
  },
  cont_key: [13],
  text: getInstructFeedback,
  timing_post_trial: 0,
  timing_response: 180000
};


odd_even = true; // `pages` in the below is evaluated now...
var instructions_block = {
  type: 'poldrack-instructions',
  data: {
    trial_id: 'instruction'
  },
  pages: [
    '<div class = prp_centerbox><p class ="block-text">In this experiment, you will have to do two tasks in quick succession. You will respond by pressing the "Z", "X", "C", "V" and '+ (odd_even ? '' :'"H", "J", ') +'"K", "L" keys.</p>' +
    '<p class ="block-text">First, a either a coloured square or a number will appear on the screen. If the square is the ' + borders[0][1] + ' square (on the far-left below), you should press the "Z" key. If it is the ' + borders[1][1] + ' square (on the centre-left), you should press the "X" key. If it is the ' + borders[2][1] + ' square (on the centre-right), you should press the "C" key. And if it is the ' + borders[3][1] + ' square (on the far-right), you should press the "V" key. </p>' +
    box1 + box2 + box3 + box4 + '</div>',
    '<div class = prp_centerbox><p class ="block-text">After a short delay, either one of four numbers will appear in the square (as you can see below), or else a coloured square will appear to surround the number. ' +
    ( odd_even ? 'If the number is odd press the "K" key. If the number is even press the "L" key' : 'If the number is ' + inners[0] + ' press the "H" key. If the number is ' + inners[1] + ' press the "J" key.\n' + 'If the number is ' + inners[2] + ' press the "K" key. If the number is ' + inners[3] + ' press the "L" key.</p>' ) +
    '<p class ="block-text"><em>It is very important that you respond as quickly as possible! You must respond to the stimuli in the order they appear.</em></p>' +
    box_number1 + box_number2 + box_number3 + box_number4 +'</div>', '<div class = prp_centerbox><p class ="block-text">We will start with some practice after you end the instructions. Make sure you remember which coloured squares and which numbers correspond to which keys. Go through the instructions again if you need to.</p></div>'
  ],
  allow_keys: false,
  show_clickable_nav: true,
  timing_post_trial: 1000,
};

/// This ensures that the subject does not read through the instructions too quickly.  If they do it too quickly, then we will go over the loop again.
var instruction_node = {
  timeline: [feedback_instruct_block, instructions_block],
  /* This function defines stopping criteria */
  loop_function: function(data) {
    for (i = 0; i < data.length; i++) {
      if ((data[i].trial_type == 'poldrack-instructions') && (data[i].rt != -1)) {
        rt = data[i].rt
        sumInstructTime = sumInstructTime + rt
      }
    }
    if (sumInstructTime <= instructTimeThresh * 1000) {
      feedback_instruct_text =
        'Read through instructions too quickly.  Please take your time and make sure you understand the instructions.  Press <strong>enter</strong> to continue.'
      return true
    } else if (sumInstructTime > instructTimeThresh * 1000) {
      feedback_instruct_text =
        'Done with instructions. Press <strong>enter</strong> to continue.'
      return false
    }
  }
}

/* We have a bit of an issue with our primary blocks.
 * It would be nice to use `on_start` to pass parameters
 * But `getStim` seems to be called before it, and calling `getStim` from inside
 * of `on_start` just gets us no stim at all for some reason.
 * So instead we're going to use an off-by-one trick and set things in the
 * previous nodes' `on_finish`.
**/
var start_practice_block = {
  type: 'poldrack-text',
  data: {
    trial_id: 'intro',
    exp_stage: 'practice'
  },
  text: '<div class = prp_centerbox><p class = "center-block-text">We will start ' +
    practice_len + ' practice trials. Press <strong>enter</strong> to begin.</p></div>',
  cont_key: [13],
  timing_post_trial: 1000,
  on_finish: function() {
    stim_modes = "both";
    stim_order = jsPsych.randomization.shuffle([true, false])[0];
      // set this ^^^ for the first actual practice trial
    odd_even = true;
    stim_order_check = "Changed"
  }
};

var start_box_block = {
  type: 'poldrack-text',
  data: {
    trial_id: 'intro_box',
    exp_stage: 'test'
  },
  text: '<div class = prp_centerbox><p class ="center-block-text">We will now start a coloured-box-only test run. Press <strong>enter</strong> to begin.</p></div>',
  cont_key: [13],
  timing_post_trial: 1000,
  on_finish: function() {
     current_trial = 0;
     stim_modes = "colour";
     stim_order = true;
   }
};

var start_number_block = {
  type: 'poldrack-text',
  data: {
    trial_id: 'intro_box',
    exp_stage: 'test'
  },
  text: '<div class = prp_centerbox><p class ="center-block-text">We will now start a number-only test run. Press <strong>enter</strong> to begin.</p></div>',
  cont_key: [13],
  timing_post_trial: 1000,
  on_finish: function() {
    current_trial = 0;
    stim_modes = "number";
    stim_order = false; // number first (and second, but that doesn't matter)
    odd_even = true;
  }
};

var start_test_block = {
  type: 'poldrack-text',
  data: {
    trial_id: 'intro',
    exp_stage: 'test'
  },
  text: '<div class = prp_centerbox><p class ="center-block-text">We will now start the test. Press <strong>enter</strong> to begin.</p></div>',
  cont_key: [13],
  timing_post_trial: 1000,
  on_finish: function() {
    current_trial = 0;
    stim_modes = "both";
    stim_order = jsPsych.randomization.shuffle([true, false])[0];
      // set this ^^^ for the first actual test trial
    odd_even = true;
  }
};

var fixation_block = {
  type: 'poldrack-single-stim',
  stimulus: '<div class = centerbox><div class = "center-text">+</div></div>',
  is_html: true,
  timing_stim: 300,
  timing_response: 300,
  data: {
    trial_id: 'fixation'
  },
  choices: 'none',
  timing_post_trial: 1000,
  on_finish: function(){
    var last_trial= jsPsych.data.getDataByTrialIndex(jsPsych.progress().current_trial_global-1)
    jsPsych.data.addDataToLastTrial({exp_stage: last_trial.exp_stage})
  }
}

/* define box-only block */

var box_only_block = {
  type: 'poldrack-multi-stim-multi-response',
  stimuli: getStim,
  is_html: true,
  data: {
    trial_id: 'stim',
    exp_stage: 'box_only'
  },
  choices: [choices, choices],
  timing_stim: getISI,
  timing_response: 2000,
  response_ends_trial: true,
  on_finish: function() {
    curr_data.trial_num = current_trial
    jsPsych.data.addDataToLastTrial(curr_data)
    current_trial += 1
  },
  timing_post_trial: 500
}

/* define number-only block */

var number_only_block = {
  type: 'poldrack-multi-stim-multi-response',
  stimuli: getStim,
  is_html: true,
  data: {
    trial_id: 'stim',
    exp_stage: 'number_only'
  },
  choices: [choices, choices],
  timing_stim: getISI,
  timing_response: 2000,
  response_ends_trial: true,
  on_finish: function() {
    curr_data.trial_num = current_trial
    jsPsych.data.addDataToLastTrial(curr_data)
    current_trial += 1
  },
  timing_post_trial: 500
}


/* define practice block */
var practice_block = {
  type: 'poldrack-multi-stim-multi-response',
  stimuli: getStim,
  is_html: true,
  data: {
    trial_id: 'stim',
    exp_stage: 'practice',
    random_flag : jsPsych.randomization.shuffle(['a', 'b'])[0],
  },
  choices: [choices, choices],
  timing_stim: getISI,
  timing_response: 2000,
  response_ends_trial: true,
  on_finish: function() {
    curr_data.trial_num = current_trial
    jsPsych.data.addDataToLastTrial(curr_data)
    current_trial += 1
    // don't set stim_order here - it messes with the FB
  },
  timing_post_trial: 500
}

var feedback_block = {
  type: 'poldrack-single-stim',
  stimulus: getFB,
  is_html: true,
  data: {
    trial_id: 'feedback',
    exp_stage: 'practice'
  },
  timing_stim: -1,
  timing_response: -1,
  response_ends_trial: true,
  timing_post_trial: 500,
  on_start : function(){
      console.log(stim_modes, stim_order, odd_even);
  },
  on_finish : function(){
    stim_order = jsPsych.randomization.shuffle([true, false])[0];
      // set this for the *next* trial
  }
}


/* define test block */
var test_block = {
  type: 'poldrack-multi-stim-multi-response',
  stimuli: getStim,
  is_html: true,
  data: {
    trial_id: 'stim',
    exp_stage: 'test'
  },
  choices: [choices, choices],
  timing_stim: getISI,
  response_ends_trial: true,
  timing_response: 2000,
  on_finish: function() {
    curr_data.trial_num = current_trial
    jsPsych.data.addDataToLastTrial(curr_data)
    current_trial += 1
    stim_order = jsPsych.randomization.shuffle([true, false])[0];
      // set this for the *next* trial
  },
  timing_post_trial: 500
}


/* create experiment definition array */
var psychological_refractory_period_four_choices_experiment = [];

// intro & practice
psychological_refractory_period_four_choices_experiment.push(instruction_node);
psychological_refractory_period_four_choices_experiment.push(start_practice_block);

// practice section
for (var i = 0; i < practice_len; i++) {
  psychological_refractory_period_four_choices_experiment.push(fixation_block);
  psychological_refractory_period_four_choices_experiment.push(practice_block);
  psychological_refractory_period_four_choices_experiment.push(feedback_block);
}

// box only
psychological_refractory_period_four_choices_experiment.push(start_box_block);
for (var i = 0; i < practice_len; i++) {
  psychological_refractory_period_four_choices_experiment.push(fixation_block);
  psychological_refractory_period_four_choices_experiment.push(box_only_block)
}

// number only
psychological_refractory_period_four_choices_experiment.push(start_number_block);
for (var i = 0; i < practice_len; i++) {
  psychological_refractory_period_four_choices_experiment.push(fixation_block);
  psychological_refractory_period_four_choices_experiment.push(number_only_block)
}

// Full Monty
psychological_refractory_period_four_choices_experiment.push(attention_node);
psychological_refractory_period_four_choices_experiment.push(start_test_block);
for (var i = 0; i < exp_len; i++) {
  psychological_refractory_period_four_choices_experiment.push(fixation_block);
  psychological_refractory_period_four_choices_experiment.push(test_block)
}

psychological_refractory_period_four_choices_experiment.push(attention_node);
psychological_refractory_period_four_choices_experiment.push(post_task_block)
psychological_refractory_period_four_choices_experiment.push(end_block);
