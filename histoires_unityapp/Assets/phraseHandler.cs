using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class phraseHandler : MonoBehaviour
{
    float vel = 0.08f;
    string text= "";
    GameObject[] chars;
    float offset = 0f;
    public GameObject templatechar;
    line line;
    GameObject lineobj;
    GameObject charContainer;
    bool textReady = false;
    bool objectsReady = false;
    // Start is called before the first frame update
    void Start()
    {
                
    }

    public void SetupPhrase(GameObject inputline, GameObject outputbox, string input)
    {
        ResetValues();
        SetObjects(inputline, outputbox);
        SetText(input);
    }

    void ResetValues()
    {
        vel = 0.08f;
        offset = 0f;
        textReady = false;
        objectsReady = false;

        if(chars !=null)
        foreach(GameObject charobj in chars){
            Destroy(charobj);
        }
    }

    void SetObjects(GameObject inputline, GameObject outputbox)
    {
        lineobj = inputline;
        line = inputline.GetComponent<line>();

        charContainer = outputbox;
        objectsReady = true;

        Debug.Log("found line component on "+lineobj.name+": ");
        Debug.Log(line);
    }


    void SetText(string input)
    {
        text = input;
        int initfontsize = 26;
        chars = new GameObject[text.Length];
        for (int i = 0; i < text.Length; i++)
        {
            chars[i] = Instantiate(templatechar);
            chars[i].transform.parent = charContainer.transform;
            chars[i].GetComponent<charHandler>().setText("" + text[i]);
        }

        textReady = true;
    }

    // Update is called once per frame
    void Update()
    {
        if (textReady&&objectsReady)
        {
            followLine();
            movePhrase();
        }
        
    }

    public void followLine()
    {
        float cumulativeOffset = 0f;
        int currentsegment = 0;

        // repeat for each character 
        for (int i = 0; i < text.Length; i++)
        {
            bool stopit = false;
            // get correct segment
            while (!stopit
                && offset + cumulativeOffset
                > line.cumulativelengths[currentsegment]
                + line.lengths[currentsegment])
            {
                currentsegment++;
                if (currentsegment >= line.numSegments) stopit = true;
            }
           // Debug.Log(currentsegment);

            if (currentsegment >= line.numSegments) currentsegment = 0;

            float charOffsetOnSegment = offset + cumulativeOffset - line.cumulativelengths[currentsegment];
            float ratio = charOffsetOnSegment / line.lengths[currentsegment];

            float charX = line.points[currentsegment*2].x + ratio * line.dx[currentsegment];
            float charY = line.points[currentsegment*2].y + ratio * line.dy[currentsegment];
            float angle = 0;// -line.angles[currentsegment];

            chars[i].transform.position = new Vector2(charX, charY);
            chars[i].transform.eulerAngles= new Vector3 (0f, 0f, angle);
            //chars[i].GetComponent<charHandler>().updateSize(10f+Mathf.Pow(line.zpos[currentsegment], 1f));
            if (line.fontsizegates.Count >= currentsegment && line.fontsizegates[currentsegment] != -1f)
            {
                chars[i].GetComponent<charHandler>().updateSize(line.fontsizegates[currentsegment]);
            }
            cumulativeOffset += chars[i].GetComponent<charHandler>().w;
        }
    }

    void movePhrase()
    {
        offset -= vel;
    }
}
